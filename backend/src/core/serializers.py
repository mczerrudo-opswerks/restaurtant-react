from decimal import Decimal
from rest_framework import serializers
from core.models import Restaurant, MenuItem, Order, OrderItem, Review
from django.db import transaction

class MenuItemSerializer(serializers.ModelSerializer):
    # SerializerMethodField is read-only
    restaurant_name = serializers.SerializerMethodField(method_name= 'get_restaurant_name')

    class Meta:
        model = MenuItem
        fields = ("id", "restaurant", "restaurant_name", "name", "price")

    def get_restaurant_name(self, obj):
        return obj.restaurant.name
    
class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ("id","name","address","owner","created_at")
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