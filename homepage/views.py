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
from datetime import datetime, timezone

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

def homepage_view(request):
    try:
        response = supabase.table("posts").select("*").order("id", desc=True).execute()
        posts = response.data if response.data else []
    except Exception as e:
        print("⚠️ Error fetching posts:", e)
        posts = []
    # helper to parse ISO-ish datetime strings returned by Supabase
    def _parse_dt(s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s)
        except Exception:
            try:
                return datetime.fromisoformat(s.replace('Z', '+00:00'))
            except Exception:
                return None

    # Auto-archive expired posts so they do not appear on the homepage
    try:
        now = datetime.now(timezone.utc)
        expired_ids = []
        for p in posts:
            d = _parse_dt(p.get('deadline'))
            if d is None:
                continue
            # make timezone-aware for comparison
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            if d < now and not p.get('is_archived'):
                expired_ids.append(p.get('id'))

        if expired_ids:
            # persist archival in Supabase
            for pid in expired_ids:
                try:
                    supabase.table('posts').update({'is_archived': True}).eq('id', pid).execute()
                except Exception as e:
                    print('⚠️ Failed to archive post', pid, e)
            # remove archived items from the list so template doesn't render them
            posts = [p for p in posts if p.get('id') not in expired_ids]
    except Exception as e:
        print('⚠️ Error while auto-archiving expired posts:', e)

    return render(request, "homepage/homepage.html", {"posts": posts})




    # views.py

def homepage_view(request):
    # 1. Get current time for filtering active scholarships
    now = datetime.now().isoformat()
    
    # Initialize counters
    available_count = 0
    applied_count = 0
    posts = []

    try:
        # --- QUERY A: Get "Available" (Active Scholarships) ---
        # Count posts where deadline is greater than or equal to now
        active_res = supabase.table("posts").select("id", count="exact").gte("deadline", now).execute()
        available_count = active_res.count

        # --- QUERY B: Get "Applied" (Specific to User) ---
        # We need the user's ID from the session (assuming you store it there like in your view_description)
        user_id = request.session.get("user_id")

        if user_id:
            # Count applications matching this user_id
            applied_res = supabase.table("applications").select("id", count="exact").eq("user_id", str(user_id)).execute()
            applied_count = applied_res.count

        # --- QUERY C: Get the actual Posts for the grid ---
        # Fetch active posts to display in the "Featured Scholarships" section
        posts_data = supabase.table("posts").select("*").gte("deadline", now).order("deadline", desc=False).execute()
        posts = posts_data.data

    except Exception as e:
        print("Error loading homepage data:", e)

    # Context to pass to HTML
    context = {
        'available_count': available_count,
        'applied_count': applied_count,
        'posts': posts,
        # Pass user details if needed for the profile dropdown
        'user': {
            'first_name': request.session.get("user_fullname", "Student"),
            'email': request.session.get("user_email", "")
        }
    }

    # Render the homepage with the dynamic data
    return render(request, "homepage/homepage.html", context) 
    # Note: Make sure "homepage/homepage.html" matches your actual folder structure. 
    # If it's in the root of templates, just use "homepage.html"
