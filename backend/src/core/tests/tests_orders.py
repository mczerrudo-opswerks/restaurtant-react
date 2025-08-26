# tests/test_orders.py
import uuid
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Restaurant, MenuItem, Order, OrderItem  # adjust import path

User = get_user_model()


class OrderModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user", password="userpass")
        self.owner = User.objects.create_user(username="owner", password="ownerpass", is_restaurant_owner=True)

        self.resto = Restaurant.objects.create(owner=self.owner, name="R1", address="A")
        self.item1 = MenuItem.objects.create(restaurant=self.resto, name="Burger", price=Decimal("100.00"))
        self.item2 = MenuItem.objects.create(restaurant=self.resto, name="Fries", price=Decimal("50.00"))

        self.order = Order.objects.create(user=self.user, restaurant=self.resto)
        self.oi = OrderItem.objects.create(order=self.order, menu_item=self.item1, quantity=3)

    def test_orderitem_subtotal_property(self):
        # 3 x 100.00 = 300.00
        self.assertEqual(self.oi.item_subtotal, Decimal("300.00"))

    def test_unique_together_enforced(self):
        # Creating a duplicate (order, menu_item) should fail
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                OrderItem.objects.create(order=self.order, menu_item=self.item1, quantity=1)


class OrderAPITests(APITestCase):
    def setUp(self):
        # Users
        self.user = User.objects.create_user(username="user", password="userpass")
        self.other = User.objects.create_user(username="other", password="otherpass")
        self.owner = User.objects.create_user(username="owner", password="ownerpass", is_restaurant_owner=True)

        # Restaurants
        self.resto1 = Restaurant.objects.create(owner=self.owner, name="R1", address="@1")
        self.resto2 = Restaurant.objects.create(owner=self.owner, name="R2", address="@2")

        # Menu Items
        self.r1_i1 = MenuItem.objects.create(restaurant=self.resto1, name="Burger", price=Decimal("100.00"))
        self.r1_i2 = MenuItem.objects.create(restaurant=self.resto1, name="Fries", price=Decimal("50.00"))
        self.r2_i1 = MenuItem.objects.create(restaurant=self.resto2, name="Pizza", price=Decimal("200.00"))

        # Existing orders
        self.order1 = Order.objects.create(user=self.user, restaurant=self.resto1)
        OrderItem.objects.create(order=self.order1, menu_item=self.r1_i1, quantity=1)

        self.order2 = Order.objects.create(user=self.other, restaurant=self.resto2)
        OrderItem.objects.create(order=self.order2, menu_item=self.r2_i1, quantity=2)

        self.list_url = reverse("order-list")    # from DRF router

    def login_user(self):
        self.client.logout()
        ok = self.client.login(username="user", password="userpass")
        self.assertTrue(ok, "User login failed")

    def test_auth_required_for_list(self):
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_current_users_orders(self):
        self.login_user()
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # should only see 1 order (self.order1)
        self.assertEqual(len(res.data), 1)
        # if serializer returns order_id field, check it matches
        returned_ids = {str(item.get("order_id")) for item in res.data}
        self.assertIn(str(self.order1.order_id), returned_ids)
        self.assertNotIn(str(self.order2.order_id), returned_ids)

    @patch("core.views.send_order_created_email.delay") 
    def test_create_order_success_and_triggers_task(self, mock_delay):
        self.login_user()
        payload = {
            "restaurant": self.resto1.pk,
            "items": [
                {"menu_item": self.r1_i1.pk, "quantity": 2},
                {"menu_item": self.r1_i2.pk, "quantity": 1},
            ],
        }
        res = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_id = res.data.get("order_id")
        self.assertIsNotNone(created_id)
        order = Order.objects.get(order_id=uuid.UUID(str(created_id)))
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.restaurant_id, self.resto1.id)
        self.assertEqual(order.items.count(), 2)

        # Celery task called with order_id
        mock_delay.assert_called_once_with(order.order_id)

    def test_create_order_rejects_cross_restaurant_items(self):
        self.login_user()
        payload = {
            "restaurant": self.resto1.pk,
            "items": [
                {"menu_item": self.r1_i1.pk, "quantity": 1},
                {"menu_item": self.r2_i1.pk, "quantity": 1},  # wrong restaurant
            ],
        }
        res = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        

    def test_retrieve_only_own_order(self):
        self.login_user()
        # own order should be accessible
        url = reverse("order-detail", args=[str(self.order1.order_id)])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # other's order should 404 (queryset filters by request.user)
        url_other = reverse("order-detail", args=[str(self.order2.order_id)])
        res2 = self.client.get(url_other)
        self.assertEqual(res2.status_code, status.HTTP_404_NOT_FOUND)
