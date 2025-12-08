import re
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib import messages
from supabase import create_client, Client
from datetime import datetime, timezone
from django.conf import settings
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import requests
from admin_page.views import student_required

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)


def iSKOLARapp_view(request):
    return render(request, "dashboard/iskolar.html")


# ---------------------------------------------------------
# SAVED SCHOLARSHIPS
# ---------------------------------------------------------
@student_required
def saved_scholarships_view(request):
    try:
        resp = supabase.table("posts").select("*").eq("is_saved", True).execute()
        posts = resp.data or []
    except Exception as e:
        print("⚠️ Error fetching saved scholarships:", e)
        posts = []

    return render(request, "saved_scholarships.html", {"posts": posts})


# ---------------------------------------------------------
# STUDENT APPLICATIONS
# ---------------------------------------------------------
@student_required
def applications_view(request):

    # 🔥 FIX — USE SUPABASE UUID
    supabase_user_id = request.session.get("supabase_user_id")

    if not supabase_user_id:
        return redirect("login")

    # 1. Fetch all applications using SUPABASE UUID
    res_app = (
        supabase.table("applications")
        .select("*")
        .eq("user_id", supabase_user_id)  # UUID
        .execute()
    )

    applications = res_app.data or []
    posts = []

    # 2. Join each application with its post
    for app in applications:
        post_id = app.get("post_id")

        if not post_id or len(str(post_id)) != 36:
            continue

        res_post = (
            supabase.table("posts")
            .select("*")
            .eq("id", str(post_id))
            .maybe_single()
            .execute()
        )

        post = res_post.data
        if not post:
            continue

        post["status"] = app.get("status", "Pending")
        posts.append(post)

    # 3. Count totals per status
    pending_count = sum(1 for p in posts if p["status"].lower() == "pending")
    review_count = sum(1 for p in posts if p["status"].lower() == "review")
    # Accept both 'accepted' and legacy 'approved' set by admin actions
    accepted_count = sum(1 for p in posts if p["status"].lower() in ("accepted", "approved"))
    rejected_count = sum(1 for p in posts if p["status"].lower() == "rejected")

    return render(request, "applications.html", {
        "posts": posts,
        "pending_count": pending_count,
        "review_count": review_count,
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
    })


# ---------------------------------------------------------
# ARCHIVES
# ---------------------------------------------------------
@student_required
def archives_view(request):
    resp = supabase.table("posts").select("*").eq("is_archived", True).execute()
    posts = resp.data if resp.data else []

    # mark expired flag per post so templates can render an "expired" badge
    for post in posts:
        post_deadline = post.get("deadline")
        is_expired = False
        if post_deadline:
            try:
                # support ISO strings with Z or timezone offset
                dl = post_deadline.replace('Z', '+00:00') if isinstance(post_deadline, str) else post_deadline
                dt = datetime.fromisoformat(dl)
                # compare with UTC if aware, else with naive UTC
                if dt.tzinfo is not None:
                    is_expired = dt < datetime.now(timezone.utc)
                else:
                    is_expired = dt < datetime.utcnow()
            except Exception:
                is_expired = False
        post["is_expired"] = is_expired

    # counts for tabs
    total_count = len(posts)
    expired_count = sum(1 for p in posts if p.get("is_expired"))
    active_count = total_count - expired_count

    return render(request, "archives.html", {
        "posts": posts,
        "total_count": total_count,
        "active_count": active_count,
        "expired_count": expired_count,
    })



# ---------------------------------------------------------
# UNSAVE / UNARCHIVE
# ---------------------------------------------------------
def unarchive_post(request, post_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        supabase.table('posts').update({'is_archived': False}).eq('id', post_id).execute()
        return JsonResponse({'ok': True})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def unsave_post(request, post_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        supabase.table('posts').update({'is_saved': False}).eq('id', post_id).execute()
        return JsonResponse({'ok': True})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def logout_view(request):
    logout(request)
    return redirect("/login/")

@student_required
def view_my_application(request, post_id):
    """View student's own application details for a specific scholarship"""
    supabase_user_id = request.session.get("supabase_user_id")
    
    if not supabase_user_id:
        return redirect("login")
    
    try:
        # Get the application
        app_res = (
            supabase.table("applications")
            .select("*")
            .eq("user_id", supabase_user_id)
            .eq("post_id", post_id)
            .maybe_single()
            .execute()
        )
        
        application = app_res.data
        
        if not application:
            messages.error(request, "Application not found.")
            return redirect("applications")
        
        # Get the post/scholarship details
        post_res = (
            supabase.table("posts")
            .select("*")
            .eq("id", post_id)
            .maybe_single()
            .execute()
        )
        
        post = post_res.data
        
        if not post:
            messages.error(request, "Scholarship not found.")
            return redirect("applications")
        
        # Get submitted files
        files_res = (
            supabase.table("application_files")
            .select("*")
            .eq("application_id", application["id"])
            .execute()
        )
        
        files = files_res.data or []
        
        return render(request, "view_my_application.html", {
            "application": application,
            "post": post,
            "files": files,
        })
        
    except Exception as e:
        print(f"Error viewing application: {e}")
        messages.error(request, "An error occurred while loading your application.")
        return redirect("applications")
