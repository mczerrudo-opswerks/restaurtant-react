from django.contrib import admin
from .models import Restaurant, MenuItem, Order, OrderItem, Review, User
# Register your models here.



class RestaurantAdmin(admin.ModelAdmin):
    list_display = ("name","owner","address","created_at")
    
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name","restaurant","price")

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 2

class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_id","user","restaurant","status","created_at")
    inlines = [OrderItemInline]

admin.site.register(Review)
admin.site.register(User)
admin.site.register(Restaurant, RestaurantAdmin) 
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(Order, OrderAdmin)