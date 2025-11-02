import re
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib import messages
from supabase import create_client, Client
from django.conf import settings
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import requests
from django.contrib.auth.decorators import login_required

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

# Create your views here.
def profile_view(request):
    return render(request, "profile/profile.html")

def logout_view(request):
    logout(request)
    return redirect("iSKOLARapp")


from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def view_profile(request):
    user = request.user  # currently logged-in user

    context = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
    }

    return render(request, 'profile/view-profile.html', context)
