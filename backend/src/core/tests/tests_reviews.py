from django.core.cache import cache
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Restaurant, Review  # adjust if needed

User = get_user_model()


class ReviewAPITests(APITestCase):
    def setUp(self):
        cache.clear()

        self.owner = User.objects.create_user(username="owner", password="ownerpass", is_restaurant_owner=True)
        self.user = User.objects.create_user(username="user", password="userpass")
        self.other_user = User.objects.create_user(username="other", password="otherpass")

        self.resto = Restaurant.objects.create(owner=self.owner, name="Pizza A", address="@1")
        self.resto2 = Restaurant.objects.create(owner=self.owner, name="Burger B", address="@2")

        self.review1 = Review.objects.create(user=self.user, restaurant=self.resto, rating=4, comment="Nice")
        self.review2 = Review.objects.create(user=self.other_user, restaurant=self.resto2, rating=5, comment="Great")

        self.list_url = reverse("review-list")
        self.detail_url = lambda pk: reverse("review-detail", args=[pk])

    
    def login_user(self):
        self.client.logout()
        ok = self.client.login(username="user", password="userpass")
        self.assertTrue(ok, "User login failed")

    def login_other(self):
        self.client.logout()
        ok = self.client.login(username="other", password="otherpass")
        self.assertTrue(ok, "Other user login failed")

    def test_list_reviews(self):
        self.login_user()
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

    def test_retrieve_review(self):
        self.login_user()
        res = self.client.get(self.detail_url(self.review1.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], self.review1.pk)

    def test_create_review_success(self):
        self.login_user()
        payload = {"restaurant": self.resto2.id, "rating": 3, "comment": "ok"}
        res = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.filter(user=self.user, restaurant=self.resto2).count(), 1)

    def test_create_review_duplicate_same_user_and_restaurant(self):
        self.login_user()
        payload = {"restaurant": self.resto.id, "rating": 5}
        res = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_review_invalid_rating_low_high(self):
        self.login_user()
        for bad in [0, 6]:
            res = self.client.post(self.list_url, {"restaurant": self.resto.id, "rating": bad}, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_own_review(self):
        self.login_user()
        res = self.client.patch(self.detail_url(self.review1.pk), {"rating": 2}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.review1.refresh_from_db()
        self.assertEqual(self.review1.rating, 2)

    def test_cannot_update_others_review(self):
        self.login_user()
        res = self.client.patch(self.detail_url(self.review2.pk), {"rating": 1}, format="json")
        self.assertIn(res.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

    def test_delete_own_review(self):
        self.login_user()
        res = self.client.delete(self.detail_url(self.review1.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Review.objects.filter(pk=self.review1.pk).exists())

    def test_cannot_delete_others_review(self):
        self.login_user()
        res = self.client.delete(self.detail_url(self.review2.pk))
        self.assertIn(res.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
