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

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

def iSKOLARapp_view(request):
    return render(request, "dashboard/iskolar.html")


    #Icon functionalities saved, archive, appplied.

def saved_scholarships_view(request):
    try:
        # Fetch posts that are marked as saved (from Supabase)
        resp = supabase.table("posts").select("*").eq("is_saved", True).execute()
        posts = resp.data if resp.data else []
    except Exception as e:
        print("⚠️ Error fetching saved scholarships:", e)
        posts = []
    
    # ✅ Make sure this matches your file name: saved_scholarships.html
    return render(request, "saved_scholarships.html", {"posts": posts})


def applications_view(request):
    resp = supabase.table("posts").select("*").eq("is_applied", True).execute()
    posts = resp.data if resp.data else []
    return render(request, "applications.html", {"posts": posts})

def archives_view(request):
    resp = supabase.table("posts").select("*").eq("is_archived", True).execute()
    posts = resp.data if resp.data else []
    return render(request, "archives.html", {"posts": posts})

