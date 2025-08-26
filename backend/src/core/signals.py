from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from core.models import MenuItem, Review
from django.core.cache import cache


@receiver([post_save, post_delete], sender=MenuItem)
def invalidate_menu_cache(sender, instance, **kwargs):
    """
    Invalidate menu list caches when a menu item is created, updated, or deleted
    """
    print("Clearing menuitem cache")
    
    # Clear menu item list caches
    cache.delete_pattern('*menu_list*')

@receiver([post_save, post_delete], sender=Review)
def invalidate_menu_cache(sender, instance, **kwargs):
    """
    Invalidate menu list caches when a menu item is created, updated, or deleted
    """
    print("Clearing review cache")
    
    # Clear menu item list caches
    cache.delete_pattern('*review_list*')