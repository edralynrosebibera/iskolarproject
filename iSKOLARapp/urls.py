from django.contrib.auth import views as auth_views
from django.urls import path, include
from . import views  # if you keep forgot_view or others

urlpatterns = [
    path("", views.iSKOLARapp_view, name="iSKOLARapp"),
    path("archives/", views.archives_view, name="archives"),
    path("archives/unarchive/<str:post_id>/", views.unarchive_post, name="unarchive_post"),
    path("saved_scholarships/", views.saved_scholarships_view, name="saved_scholarships"),
    path("saved_scholarships/unsave/<str:post_id>/", views.unsave_post, name="unsave_post"),
    path("applications/", views.applications_view, name="applications"),
    
]
