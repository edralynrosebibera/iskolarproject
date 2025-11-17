from django.contrib.auth import views as auth_views
from django.urls import path, include
from . import views  # if you keep forgot_view or others

urlpatterns = [
    path("", views.iSKOLARapp_view, name="iSKOLARapp"),
    path("archives/", views.archives_view, name="archives"),
    path("saved_scholarships/", views.saved_scholarships_view, name="saved_scholarships"),
    path("applications/", views.applications_view, name="applications"),
]