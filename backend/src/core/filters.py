import django_filters
from core.models import MenuItem, Restaurant, Order
from rest_framework import serializers
class MenuItemFilter(django_filters.FilterSet):
    class Meta:
        model = MenuItem
        fields = {
            # name field: allow exact match and icontains lookup
            "name": ["exact", "icontains"],  

            # restaurant id: only exact match (e.g. ?restaurant=3)
            "restaurant": ["exact"],         

            # price field: allow exact, less than, greater than, and range
            "price": ["exact", "lt", "gt", "range"],  
        }

class RestaurantFilter(django_filters.FilterSet):
    # custom (non-model) filter: OK to declare here
    owner_name = django_filters.CharFilter(
        field_name="owner__username",
        lookup_expr="exact"   # or "exact" if you want case-sensitive
    )

    class Meta:
        model = Restaurant
        fields = {
            "name": ["exact", "icontains"],
        }

class OrderFilter(django_filters.FilterSet):
    class Meta:
        model = Order
        fields = {
            "restaurant": ["exact"],
            "status": ["exact"],
        }