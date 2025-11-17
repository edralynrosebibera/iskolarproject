"""
URL configuration for iSKOLAR project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from iSKOLARapp import views as admin_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('iSKOLARapp.urls')),
    path('dashboard/', include('dashboard.urls')),
    path("login/", include("login.urls")),
    path("signup/", include("signup.urls")),
    path("homepage/", include("homepage.urls")),
    path("profile/", include("profile_app.urls")),
    path('admin-page/', include('admin_page.urls')),  
    path('logout/', admin_views.logout_view, name='logout'),
# include admin_page URLs
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
