import uuid
from decimal import Decimal
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

# Models

class User(AbstractUser):
    """
    Custom user model

    """
    is_restaurant_owner = models.BooleanField(default=False) 



class Restaurant(models.Model):
    """
    Restaurant model

    """
    owner = models.ForeignKey(                     
        User,
        related_name="restaurants_owned",
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=120, unique=True)
    address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: 
        ordering = ["name"]

    def __str__(self): 
        return self.name

class MenuItem(models.Model):
    """
    Menu Item model. The things that the restaurant sells

    """
    restaurant = models.ForeignKey(Restaurant, related_name="menu_items", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])

    class Meta:
        # There can only be one name per restaurant
        unique_together = ("restaurant", "name")
        ordering = ["restaurant_id"]

    def __str__(self): 
        return f"{self.name} @ {self.restaurant.name}"

class Order(models.Model):
    """
    Orders from a Restaurant

    """
    class StatusChoice(models.TextChoices):
        PENDING="pending","Pending"
        CONFIRMED="confirmed","Confirmed"
        CANCELLED="cancelled","Cancelled" 
    order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="orders", on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, related_name="orders", on_delete=models.PROTECT)
    status = models.CharField(
        max_length=20, 
        choices=StatusChoice.choices, 
        default=StatusChoice.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    menu_items = models.ManyToManyField(MenuItem, through="OrderItem", related_name="orders")
   
    def __str__(self): 
        return f"Order {self.order_id} by {self.user}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, related_name="order_items", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    
    class Meta:
        unique_together = ("order", "menu_item")
    
    def __str__(self): 
        return f"{self.quantity} X {self.menu_item.name} (Order {self.order.order_id})"

    @property
    def item_subtotal(self):
        return self.quantity * self.menu_item.price
    
class Review(models.Model):
    user = models.ForeignKey(User, related_name="reviews", on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, related_name="reviews", on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "restaurant")
        ordering = ["restaurant_id"]

    def __str__(self): 
        return f"{self.rating}★ by {self.user} @ {self.restaurant}"