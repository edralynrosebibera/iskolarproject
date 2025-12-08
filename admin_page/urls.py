from django.urls import path
from . import views

urlpatterns = [
    path("", views.admin_view, name="admin_page"),
    path("create-post/", views.create_post_view, name="create-post"),
    path("posts/", views.posts_view, name="posts"),
    path("get-posts/", views.get_posts_view, name="get_posts"),
    path("edit-post/<uuid:post_id>/", views.edit_post_view, name="edit_post"),
    path("delete-post/<uuid:post_id>/", views.delete_post_view, name="delete_post"),
    path('logout/', views.logout_view, name='logout'),
       # Description pages
    path("create-description/", views.create_description, name="create_description"),
    path("view-description/<uuid:post_id>/", views.view_description, name="view_description"),

    # Optional: show all description records (for admin)
    path("description-posts/", views.description_posts_view, name="description_posts"),

    # Optional advanced endpoints
    path("get-submissions/<uuid:post_id>/", views.get_submissions, name="get_submissions"),
    path("save-description/", views.save_description, name="save_description"),
    path("submit-requirements/<uuid:post_id>/", views.submit_requirements, name="submit_requirements"),



    path("analytics/", views.analytics_view, name="analytics"),
    path("analytics/json/", views.analytics_json, name="analytics_json"),
    path("applications/json/", views.applications_json, name="applications_json"),
    path("admin-dashboard/", views.dashboard_view, name="admin_dashboard"),
     path("applications/", views.admin_applications_view, name="admin_applications"),
    path("applications/<int:app_id>/", views.admin_view_application, name="admin_view_application"),
    path("applications/<int:app_id>/json/", views.admin_view_application_json, name="admin_view_application_json"),
    path("applications/<int:app_id>/approve/", views.admin_approve_application, name="admin_approve_application"),
    path("applications/<int:app_id>/reject/", views.admin_reject_application, name="admin_reject_application"),

    path("users/json/", views.users_json, name="users_json"),
    path("users/<uuid:user_id>/suspend/", views.suspend_user, name="suspend_user"),
    path("users/<uuid:user_id>/unsuspend/", views.unsuspend_user, name="unsuspend_user"),
    path("users/<uuid:user_id>/update-role/", views.update_user_role, name="update_user_role"),


]

