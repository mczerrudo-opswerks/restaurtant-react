from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter

urlpatterns = [
    path('menu_item/', views.MenuItemListCreateAPIView.as_view(), name='menu-item'),
    path('menu_item/<int:menu_id>/', views.MenuItemRetrieveUpdateDestroyAPIView.as_view(), name='menu-detail'),
]

router = DefaultRouter()
router.register("restaurants", views.RestaurantViewSet, basename="restaurant")
router.register("orders", views.OrderViewSet, basename="order")
router.register("reviews", views.ReviewViewSet, basename="review")
urlpatterns += router.urls
