from decimal import Decimal
from rest_framework import serializers
from core.models import Restaurant, MenuItem, Order, OrderItem, Review
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "is_restaurant_owner")


class RegisterSerializer(serializers.ModelSerializer):
    # Optional: require unique email; drop this if your project doesn't enforce unique emails
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Email already in use.")],
    )
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password2 = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "password", "password2"]

    def validate(self, attrs):
        # passwords match
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        # run Django’s password validators
        #validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password2", None)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class MenuItemSerializer(serializers.ModelSerializer):
    # SerializerMethodField is read-only
    restaurant_name = serializers.SerializerMethodField(method_name= 'get_restaurant_name')

    class Meta:
        model = MenuItem
        fields = ("id", "restaurant", "restaurant_name", "name", "price")

    def get_restaurant_name(self, obj):
        return obj.restaurant.name
    
class RestaurantSerializer(serializers.ModelSerializer):

    owner_name = serializers.CharField(source='owner.username', read_only=True)
    class Meta:
        model = Restaurant
        fields = ("id","name","address","owner","owner_name","created_at",)
        extra_kwargs = {
            'owner': {'read_only': True}
        }

class OrderItemCreateSerializer(serializers.ModelSerializer):
        class Meta:
            model = OrderItem
            fields = (
                'menu_item',
                'quantity',
            )
class OrderItemReadSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer()
    item_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    class Meta:
        model = OrderItem
        fields = ("id","menu_item","quantity","item_subtotal")

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ("order_id","user","restaurant","status","created_at","items")
        read_only_fields = ("user","total","created_at","status")

class OrderCreateSerializer(serializers.ModelSerializer):
    
    order_id = serializers.UUIDField(read_only=True)
    items = OrderItemCreateSerializer(many=True, default = None)

    # Override the Upate
    def update(self,instance, validated_data):
        orderitem_data = validated_data.pop('items')
        
        with transaction.atomic(): # something fails inside it goes back to the db goes back to its initial state
            instance = super().update(instance,validated_data)

            if orderitem_data is not None:
                # Clear existing items (optional)
                instance.items.all().delete()

                # Re add the items with the updated data
                for item in orderitem_data:
                    OrderItem.objects.create(order=instance,**item)


        return instance

    # Override the Create function of a serializer
    def create(self, validated_data):
        orderitem_data = validated_data.pop('items')

        with transaction.atomic():
            order = Order.objects.create(**validated_data)

            for item in orderitem_data:
                OrderItem.objects.create(order=order,**item)

        return order
    
    def validate(self, data):
        restaurant = data.get('restaurant')
        items = data.get('items', [])

        menu_item_ids = [item['menu_item'].id for item in items]

        menu_items = MenuItem.objects.filter(id__in=menu_item_ids)

        for menu_item in menu_items:
            if menu_item.restaurant_id != restaurant.id:
                raise serializers.ValidationError(
                    f"Menu item '{menu_item.name}' does not belong to the selected restaurant."
                )

        return data
    
    class Meta:
        model = Order
        fields = (
            'order_id',
            'user',
            'restaurant',
            'status',
            'items',
        )
        extra_kwargs = {
            'user': {'read_only': True}
        }
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("id","user","restaurant","rating","comment","created_at")
        extra_kwargs = {
            'user': {'read_only': True}
        }