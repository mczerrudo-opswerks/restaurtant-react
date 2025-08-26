import django_filters
from core.models import MenuItem

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
