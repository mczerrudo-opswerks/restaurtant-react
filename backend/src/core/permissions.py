from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission: allow read for anyone,
    but write only if the user is the owner.
    Works for Restaurant (obj.owner) and MenuItem (obj.restaurant.owner).
    """

    def has_object_permission(self, request, view, obj):
        # Allow safe methods (read-only)
        if request.method in permissions.SAFE_METHODS:
            return True  

        # Get the "owner" depending on the model
        if hasattr(obj, "owner"):  
            owner = obj.owner
        elif hasattr(obj, "restaurant"):  
            owner = getattr(obj.restaurant, "owner", None)
        else:
            return False  # fallback: deny if no owner info

        return request.user.is_authenticated and owner == request.user

class IsCurrentUser(permissions.BasePermission):
    """
    Custom permission: allow access only to the current user.
    """

    def has_object_permission(self, request, view, obj):
        return request.user == obj