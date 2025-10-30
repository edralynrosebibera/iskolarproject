from django.urls import path
from django.contrib.auth import views as auth_views
from . import views 

urlpatterns = [
    path("", views.profile_view, name="profile"),
    path('profile/view/', views.view_profile, name='view_profile'),
    path("logout/", views.logout_view, name="logout"),
]
