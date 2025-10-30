from django.contrib.auth import views as auth_views
from django.urls import path, include
from . import views  # if you keep forgot_view or others

urlpatterns = [
    path("", views.iSKOLARapp_view, name="iSKOLARapp"),
    path("archives/", views.archives_view, name="archives"),
    path("saved_scholarships/", views.saved_scholarships_view, name="saved_scholarships"),
    path("applications/", views.applications_view, name="applications"),
   
    path("search-posts/", views.search_posts_view, name="search_posts"),


    # ✅ Admin section
    path("admin-page/", views.admin_view, name="admin_page"),
    path("admin-page/create-post/", views.create_post_view, name="create-post"),
    path("admin-page/posts/", views.posts_view, name="posts"),

    path("get-posts/", views.get_posts_view, name="get_posts"),
    path("delete-post/<uuid:post_id>/", views.delete_post_view, name="delete_post"),
    path("edit-post/<uuid:post_id>/", views.edit_post_view, name="edit_post"),


    # ✅ password reset URLs
    path("forgot/", 
         auth_views.PasswordResetView.as_view(template_name="forgot.html"), 
         name="password_reset"),
    path("forgot/done/", 
         auth_views.PasswordResetDoneView.as_view(template_name="password_reset_done.html"), 
         name="password_reset_done"),
    path("reset/<uidb64>/<token>/", 
         auth_views.PasswordResetConfirmView.as_view(template_name="password_reset_confirm.html"), 
         name="password_reset_confirm"),
    path("reset/done/", 
         auth_views.PasswordResetCompleteView.as_view(template_name="password_reset_complete.html"), 
         name="password_reset_complete"),
]
