import re
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib import messages
from supabase import create_client, Client
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

def homepage_view(request):
    try:
        response = supabase.table("posts").select("*").eq("is_archived", False).order("id", desc=True).execute()
        posts = response.data if response.data else []
    except Exception as e:
        print("⚠️ Error fetching posts:", e)
        posts = []
    return render(request, "homepage/homepage.html", {"posts": posts})