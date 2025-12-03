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
    now = datetime.now().isoformat()

    available_count = 0
    applied_count = 0
    posts = []

    # 🔥 IMPORTANT: use the Supabase UUID, not Django ID
    supabase_user_id = request.session.get("supabase_user_id")

    try:
        # Count all available scholarships
        active_res = (
            supabase.table("posts")
            .select("*", count="exact")
            .gte("deadline", now)
            .execute()
        )
        available_count = active_res.count

        # Count the user's submitted applications
        if supabase_user_id:
            applied_res = (
                supabase.table("applications")
                .select("*", count="exact")
                .eq("user_id", supabase_user_id)   # UUID
                .execute()
            )
            applied_count = applied_res.count

        # Load all active posts
        posts_data = (
            supabase.table("posts")
            .select("*")
            .gte("deadline", now)
            .order("deadline", desc=False)
            .execute()
        )
        posts = posts_data.data or []

    except Exception as e:
        print("Error loading homepage data:", e)

    context = {
        "available_count": available_count,
        "applied_count": applied_count,
        "posts": posts,
        "user": {
            "first_name": request.session.get("user_fullname", "Student"),
            "email": request.session.get("user_email", "")
        }
    }

    return render(request, "homepage/homepage.html", context)
