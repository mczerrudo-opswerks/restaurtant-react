from core.models import Restaurant, MenuItem, Order, OrderItem, Review
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
import uuid
from decimal import Decimal
from unittest.mock import patch
from django.urls import reverse
from django.test import override_settings
from django.core.cache import cache

User = get_user_model()
class MenuItemListCreateAPITests(APITestCase):
    """
    """
    def setUp(self):
        cache.clear()

        from core.models import Restaurant, MenuItem
        self.Restaurant = Restaurant
        self.MenuItem = MenuItem

        # Users
        self.admin_user = User.objects.create_superuser(
            username="admin", password="adminpass"
        )
        self.normal_user = User.objects.create_user(
            username="user", password="userpass"
        )

        self.owner = self.admin_user

        # Data
        self.resto1 = self.Restaurant.objects.create(
            owner=self.owner, name="A", address="@1"
        )
        self.resto2 = self.Restaurant.objects.create(
            owner=self.owner, name="B", address="@2"
        )
        MenuItem.objects.create(restaurant=self.resto1, name="Alpha", price=Decimal("10.00"))
        MenuItem.objects.create(restaurant=self.resto2, name="Beta",  price=Decimal("20.00"))

      
        self.url = reverse("menu-item")
    
    # Login User
    def login_admin(self):
        self.client.logout()
        ok = self.client.login(username="admin", password="adminpass")
        self.assertTrue(ok, "Admin login failed")

    def login_user(self):
        self.client.logout()
        ok = self.client.login(username="user", password="userpass")
        self.assertTrue(ok, "User login failed")

    # Create
    def test_create_menu_item_success(self):
        self.login_admin()
        payload = {
            "restaurant": self.resto1.id,
            "name": "Burger",
            "price": "150.00",
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Burger")
        self.assertEqual(str(res.data["price"]), "150.00")
    

    def test_create_menu_item_price_must_be_non_negative(self):
        self.login_admin()
        payload = {"restaurant": self.resto1.id, "name": "Cheap", "price": "-1.00"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", res.data)

    def test_unique_together_same_restaurant_same_name_fails(self):
        self.login_admin()
        ok = {"restaurant": self.resto1.id, "name": "Soda", "price": "50.00"}
        res1 = self.client.post(self.url, ok, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        dup = {"restaurant": self.resto1.id, "name": "Soda", "price": "60.00"}
        res2 = self.client.post(self.url, dup, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unique_together_different_restaurant_allows_same_name(self):
        self.login_admin()
        p1 = {"restaurant": self.resto1.id, "name": "Fries", "price": "80.00"}
        p2 = {"restaurant": self.resto2.id, "name": "Fries", "price": "90.00"}
        r1 = self.client.post(self.url, p1, format="json")
        r2 = self.client.post(self.url, p2, format="json")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
    
    def test_non_owner_cannot_create_under_someone_elses_restaurant(self):
        self.login_user()
        payload = {"restaurant": self.resto1.id, "name": "Hack", "price": "10.00"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_menu_items(self):
        self.login_user()

        res = self.client.get(self.url, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.data
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)

        first = data[0]
        for key in ("id", "name", "price", "restaurant"):
            self.assertIn(key, first)

class MenuItemRetrieveUpdateDestroyAPI(APITestCase):
    def setUp(self):
        cache.clear()

        from core.models import Restaurant, MenuItem
        self.Restaurant = Restaurant
        self.MenuItem = MenuItem

        # Users
        self.admin_user = User.objects.create_superuser(
            username="admin", password="adminpass"
        )
        self.normal_user = User.objects.create_user(
            username="user", password="userpass"
        )

        self.owner = self.admin_user

        # Data
        self.resto1 = self.Restaurant.objects.create(
            owner=self.owner, name="A", address="@1"
        )
        self.resto2 = self.Restaurant.objects.create(
            owner=self.owner, name="B", address="@2"
        )
        self.item1 = MenuItem.objects.create(restaurant=self.resto1, name="Alpha", price=Decimal("10.00"))
        self.item2 = MenuItem.objects.create(restaurant=self.resto2, name="Beta",  price=Decimal("20.00"))

      
        self.url = lambda pk: reverse("menu-detail", kwargs={"menu_id": pk})

    # Login User ------------------------------------------------------
    def login_admin(self):
        self.client.logout()
        ok = self.client.login(username="admin", password="adminpass")
        self.assertTrue(ok, "Admin login failed")

    def login_user(self):
        self.client.logout()
        ok = self.client.login(username="user", password="userpass")
        self.assertTrue(ok, "User login failed")

    def test_retrieve_is_public(self):
        res = self.client.get(self.url(self.item1.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], self.item1.id)
        self.assertEqual(res.data["name"], "Alpha")

    def test_put_forbidden_for_normal_user(self):
        self.login_user()
        payload = {"restaurant": self.resto1.id, "name": "NewName", "price": "15.00"}
        res = self.client.put(self.url(self.item1.id), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_put_admin_ok(self):
        self.login_admin()
        payload = {"restaurant": self.resto1.id, "name": "Alpha V2", "price": "11.50"}
        res = self.client.put(self.url(self.item1.id), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item1.refresh_from_db()
        self.assertEqual(self.item1.name, "Alpha V2")
        self.assertEqual(self.item1.price, Decimal("11.50"))

    def test_patch_forbidden_for_normal_user(self):
        self.login_user()
        res = self.client.patch(self.url(self.item2.id), {"price": "22.22"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_admin_ok(self):
        self.login_admin()
        res = self.client.patch(self.url(self.item2.id), {"name": "Beta++"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item2.refresh_from_db()
        self.assertEqual(self.item2.name, "Beta++")

    def test_delete_forbidden_for_normal_user(self):
        self.login_user()
        res = self.client.delete(self.url(self.item1.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(MenuItem.objects.filter(pk=self.item1.pk).exists())

    def test_delete_admin_ok(self):
        self.login_admin()
        res = self.client.delete(self.url(self.item1.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MenuItem.objects.filter(pk=self.item1.pk).exists())

    def test_not_found_returns_404(self):
        res = self.client.get(self.url(999999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)