from django.urls import path
from django.contrib.auth import views as auth_views
from . import views 


urlpatterns = [
    path("", views.login_view, name="login"),
    path("forgot/", 
         auth_views.PasswordResetView.as_view(template_name="login/forgot.html"), 
         name="password_reset"),
    path("forgot/done/", 
         auth_views.PasswordResetDoneView.as_view(template_name="login/password_reset_done.html"), 
         name="password_reset_done"),
    path("reset/<uidb64>/<token>/", 
         auth_views.PasswordResetConfirmView.as_view(template_name="login/password_reset_confirm.html"), 
         name="password_reset_confirm"),
    path("reset/done/", 
         auth_views.PasswordResetCompleteView.as_view(template_name="login/password_reset_complete.html"), 
         name="password_reset_complete"),
]
