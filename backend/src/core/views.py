import logging
from django.utils.decorators import method_decorator
from django.shortcuts import render
from rest_framework import filters, generics, viewsets
from django.views.decorators.cache import cache_page
from core.models import Restaurant, MenuItem, Order, OrderItem, Review
from core.serializers import (
    MenuItemSerializer,
    RestaurantSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ReviewSerializer
)
from rest_framework import permissions
from core.tasks import send_order_created_email
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger('restaurantAPI')


# Create your views here.

class MenuItemListCreateAPIView(generics.ListCreateAPIView):
    """
    List all Menu Items
    """
    queryset = MenuItem.objects.order_by('pk').select_related("restaurant")
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # Caching 
    @method_decorator(cache_page(60 * 15, key_prefix = 'menu_list')) # connected with signals.py
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        import time
        time.sleep(2)
        return super().get_queryset()
    
    def perform_create(self, serializer):
        restaurant = serializer.validated_data.get("restaurant")
        if restaurant.owner_id != self.request.user.id:
            raise PermissionDenied("You can only add menu items to your own restaurant.")
        serializer.save()

class MenuItemRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve a Menu Item by its ID
    """
    queryset = MenuItem.objects.order_by('pk')
    serializer_class = MenuItemSerializer
    permission_classes =  [permissions.AllowAny]
    lookup_url_kwarg = 'menu_id' # Use this if you don't use pk in the URL

    def get_permissions(self):
        if self.request.method in ['PUT','PATCH', 'DELETE']:
            self.permission_classes = [permissions.IsAdminUser]
        return super().get_permissions()

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["name"]
    ordering_fields = ["name"]

    def perform_create(self, serializer):
        restaurant = serializer.save(owner=self.request.user)
        logger.info(f"Restaurant created: {restaurant.name} by {self.request.user}")

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related("restaurant", "user").prefetch_related("items__menu_item")   
    
    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        send_order_created_email.delay(order.order_id)
        logger.info(f"Restaurant created: {order.order_id} by {self.request.user}")

    def get_serializer_class(self):
        if self.action == "create" or self.action == "update": 
            return OrderCreateSerializer
        return super().get_serializer_class()

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Review.objects.select_related("restaurant","user")

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.method in ['PUT','PATCH', 'DELETE']:
            return qs.filter(user=self.request.user)
        return qs
    
    @method_decorator(cache_page(60 * 15, key_prefix = 'review_list')) # connected with signals.py
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        restaurant = serializer.validated_data.get("restaurant")
        user = self.request.user

        if Review.objects.filter(user=user, restaurant=restaurant).exists():
            raise PermissionDenied("You have already reviewed this restaurant.")

        serializer.save(user=user)

