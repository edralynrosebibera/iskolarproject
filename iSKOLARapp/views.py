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
from django.contrib.auth import logout

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
    user_id = request.session.get("user_id")

    if not user_id:
        return redirect("login")

    # 1. Get all applications for this user
    res_app = supabase.table("applications") \
        .select("*") \
        .eq("user_id", str(user_id)) \
        .execute()

    applications = res_app.data or []
    posts = []

    # 2. Join each application with its scholarship post
    for app in applications:
        post_id = app.get("post_id")

        res_post = supabase.table("posts") \
            .select("*") \
            .eq("id", post_id) \
            .maybe_single() \
            .execute()

        post = res_post.data
        if not post:
            continue

        # Attach application status (Pending, Accepted, Rejected)
        post["status"] = app.get("status", "Pending")

        posts.append(post)

    # 3. Status counts for tabs
    pending_count = sum(1 for p in posts if p["status"].lower() == "pending")
    review_count = sum(1 for p in posts if p["status"].lower() == "review")
    accepted_count = sum(1 for p in posts if p["status"].lower() == "accepted")
    rejected_count = sum(1 for p in posts if p["status"].lower() == "rejected")

    return render(request, "applications.html", {
        "posts": posts,
        "pending_count": pending_count,
        "review_count": review_count,
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
    })


def archives_view(request):
    resp = supabase.table("posts").select("*").eq("is_archived", True).execute()
    posts = resp.data if resp.data else []
    return render(request, "archives.html", {"posts": posts})

def logout_view(request):
    logout(request)
    return redirect('/login/')