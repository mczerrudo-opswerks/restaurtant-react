from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_order_created_email(order_id):
    send_mail(
        subject=f"Order {order_id} Created",
        message=f"Your order {order_id} was successfully created.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=["clareenz@gmail.com"],
        fail_silently=False,
    )