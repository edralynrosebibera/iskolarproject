from django.urls import path
from . import views

urlpatterns = [
    path("", views.admin_view, name="admin_page"),
    path("create-post/", views.create_post_view, name="create-post"),
    path("posts/", views.posts_view, name="posts"),
    path("get-posts/", views.get_posts_view, name="get_posts"),
    path("edit-post/<uuid:post_id>/", views.edit_post_view, name="edit_post"),
    path("delete-post/<uuid:post_id>/", views.delete_post_view, name="delete_post"),
]
