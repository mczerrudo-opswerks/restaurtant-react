#!/bin/sh
set -e                      #The script will immediately exit if any command fails.

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
