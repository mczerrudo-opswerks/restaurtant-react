from decimal import Decimal
from django.core.management.base import BaseCommand
from core.models import User, Restaurant, MenuItem, Order, OrderItem, Review

class Command(BaseCommand):
    help = "Seed the database with sample data"

    def handle(self, *args, **kwargs):


        # Delete all existing data (order first to avoid foreign key errors)
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        Review.objects.all().delete()
        MenuItem.objects.all().delete()
        Restaurant.objects.all().delete()
        User.objects.exclude(username="admin").delete()

        self.stdout.write(self.style.WARNING("⚠ All existing data deleted."))

        # Create Users
        owner = User.objects.create_user(
            username="owner1", password="pass1234", is_restaurant_owner=True
        )
        customer = User.objects.create_user(
            username="customer1", password="pass1234"
        )

        # Create Restaurant 1
        rest1 = Restaurant.objects.create(
            owner=owner,
            name="Pizza Palace",
            address="123 Main St"
        )

        # Create Restaurant 2
        rest2 = Restaurant.objects.create(
            owner=owner,
            name="Burger Haven",
            address="456 Oak Ave"
        )

        # Menu Items for Restaurant 1
        pizza = MenuItem.objects.create(
            restaurant=rest1,
            name="Pepperoni Pizza",
            price=Decimal("12.50")
        )
        pasta = MenuItem.objects.create(
            restaurant=rest1,
            name="Carbonara Pasta",
            price=Decimal("10.00")
        )

        # Menu Items for Restaurant 2
        burger = MenuItem.objects.create(
            restaurant=rest2,
            name="Cheeseburger",
            price=Decimal("8.50")
        )
        fries = MenuItem.objects.create(
            restaurant=rest2,
            name="French Fries",
            price=Decimal("3.00")
        )

        # Orders
        order1 = Order.objects.create(user=customer, restaurant=rest1)
        order2 = Order.objects.create(user=customer, restaurant=rest2)

        # Order Items for Order 1
        OrderItem.objects.create(order=order1, menu_item=pizza, quantity=2)
        OrderItem.objects.create(order=order1, menu_item=pasta, quantity=1)

        # Order Items for Order 2
        OrderItem.objects.create(order=order2, menu_item=burger, quantity=1)
        OrderItem.objects.create(order=order2, menu_item=fries, quantity=2)

        # Reviews
        Review.objects.create(
            user=customer,
            restaurant=rest1,
            rating=5,
            comment="Best pizza in town!"
        )
        Review.objects.create(
            user=customer,
            restaurant=rest2,
            rating=4,
            comment="Burgers are great, fries could be crispier."
        )


