from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from supabase import create_client, Client
import json
from django.contrib.auth import logout
from django.shortcuts import redirect
from datetime import datetime # <--- ADD THIS
from django.contrib import messages


# Initialize Supabase
url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

# Admin HTML page
def admin_view(request):
    return render(request, "admin_page/admin.html")

# ------------------------------
# SESSION GUARDS
# ------------------------------

def student_required(view_func):
    def wrapper(request, *args, **kwargs):
        # If admin tries to access a student-only page → redirect to admin dashboard
        if request.session.get("is_admin") is True:
            return redirect("/admin-page/posts/")
        
        # If missing student UUID → force logout
        supabase_user_id = request.session.get("supabase_user_id")
        if not supabase_user_id:
            logout(request)
            return redirect("/login/")
        
        # Check if user is suspended
        try:
            user_data = (
                supabase.table("users")
                .select("is_active")
                .eq("id", supabase_user_id)
                .maybe_single()
                .execute()
                .data
            )
            
            if user_data and user_data.get("is_active") == False:
                messages.error(request, "Your account has been suspended. Please contact the administrator.")
                logout(request)
                return redirect("/login/?suspended=true")
        except Exception as e:
            print(f"Error checking user suspension: {e}")
        
        return view_func(request, *args, **kwargs)
    return wrapper



def admin_required(view_func):
    def wrapper(request, *args, **kwargs):
        is_admin = request.session.get("is_admin")
        print("DEBUG is_admin =", is_admin)  # debug

        if is_admin != True:  # Must be boolean True
            return redirect("/login/")
        return view_func(request, *args, **kwargs)
    return wrapper

@csrf_exempt
def create_post_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            res = supabase.table("posts").insert({
                "title": data.get("title"),
                "description": data.get("description"),
                "location": data.get("location"),
                "qualifications": data.get("qualifications"),
                "posted_date": data.get("postedDate"),
                "deadline": data.get("deadline"),
                "scholarship_link": data.get("scholarshipLink")
            }, returning="representation").execute()

            print("SUPABASE INSERT RESULT:", res.data)

            return JsonResponse({ "success": True, "data": res.data })

        except Exception as e:
            return JsonResponse({ "success": False, "error": str(e) }, status=500)

    if request.method == "GET":
        return render(request, "admin_page/create-post.html")

# @csrf_exempt
# def get_posts_view(request):
#     try:
#         data = supabase.table("posts").select("*").order("id", desc=True).execute()
#         posts = []
#         for post in data.data:
#             posts.append({
#                 "id": post.get("id"),
#                 "title": post.get("title"),
#                 "description": post.get("description"),
#                 "location": post.get("location"),
#                 "qualifications": post.get("qualifications"),
#                 "deadline": post.get("deadline"),
#                 "link": post.get("scholarship_link"),
#                 "created_at": post.get("created_at")
#             })
#         return JsonResponse({"success": True, "data": posts})
#     except Exception as e:
#         print("⚠️ Error fetching posts:", e)
#         return JsonResponse({"success": False, "error": str(e)})


@csrf_exempt
def get_posts_view(request):
    try:
        res = supabase.table("posts").select("*").order("id", desc=True).execute()

        # If Supabase returned nothing
        if not res or not res.data:
            return JsonResponse({"success": True, "data": []})

        posts = []

        for post in res.data:

            # Safe check for description
            desc_res = (
                supabase.table("descriptionpage")
                .select("id")
                .eq("post_id", post.get("id"))
                .maybe_single()
                .execute()
            )

            # Correct safe boolean check
            has_description = bool(desc_res and desc_res.data)

            # Count applicants for this post
            applicants_res = (
                supabase.table("applications")
                .select("id", count="exact")
                .eq("post_id", post.get("id"))
                .execute()
            )
            applicants_count = applicants_res.count if applicants_res else 0

            posts.append({
                "id": post.get("id"),
                "title": post.get("title"),
                "description": post.get("description"),
                "location": post.get("location"),
                "qualifications": post.get("qualifications"),
                "deadline": post.get("deadline"),
                "link": post.get("scholarship_link"),
                "created_at": post.get("created_at"),
                "has_description": has_description,
                "applicants_count": applicants_count,
            })

        return JsonResponse({"success": True, "data": posts})

    except Exception as e:
        print("⚠️ Error fetching posts:", e)
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
def edit_post_view(request, post_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            print(f"Editing post {post_id} with data:", data)
            
            res = supabase.table("posts").update({
                "title": data.get("title"),
                "description": data.get("description"),
                "location": data.get("location"),
                "qualifications": data.get("qualifications"),
                "deadline": data.get("deadline"),
                "scholarship_link": data.get("scholarshipLink"),
            }).eq("id", post_id).execute()

            print("Supabase update result:", res.data)
            
            if not res.data:
                return JsonResponse({"success": False, "error": "Post not found or not updated."})
            return JsonResponse({"success": True, "data": res.data})
        except Exception as e:
            print(f"Error editing post {post_id}:", e)
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    return JsonResponse({"success": False, "error": "Invalid request method"})

@csrf_exempt
def delete_post_view(request, post_id):
    if request.method in ["DELETE", "POST"]:
        try:
            res = supabase.table("posts").delete().eq("id", post_id).execute()
            if not res.data:
                return JsonResponse({"success": False, "error": "Post not found or already deleted."})
            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    return JsonResponse({"success": False, "error": "Invalid method"})

def posts_view(request):
    return render(request, "admin_page/posts.html")

def logout_view(request):
    logout(request)
    return redirect('/login/')

def create_description(request):
    return render(request, "admin_page/index.html")

@student_required
def view_description(request, post_id):
    return render(request, "admin_page/view.html", {
        "django_user_id": request.session.get("user_id"),
        "django_user_email": request.session.get("user_email"),
        "django_user_name": request.session.get("user_fullname"),
    })

def get_submissions(request, post_id):
    data = supabase.table("submissions").select("*").eq("post_id", post_id).execute()
    return JsonResponse(data.data, safe=False)

@csrf_exempt
def save_description(request):
    if request.method == "POST":
        body = json.loads(request.body)
        post_id = body.get("post_id")
        content = body.get("content")
        supabase.table("descriptionpage").insert({
            "post_id": post_id,
            "content": content
        }).execute()
        return JsonResponse({"success": True})

def description_posts_view(request):
    return render(request, "admin_page/descriptionposts.html")

def dashboard_view(request):
    return render(request, "admin_page/admin-dashboard.html")

def analytics_view(request):
    try:
        total_res = supabase.table("posts").select("id", count="exact").execute()
        total_count = total_res.count

        now = datetime.now().isoformat()
        active_res = supabase.table("posts").select("id", count="exact").gte("deadline", now).execute()
        active_count = active_res.count

        try:
            user_res = supabase.table("users").select("id", count="exact").execute()
            user_count = user_res.count
        except:
            user_count = 0

        context = {
            'active_count': active_count,
            'total_count': total_count,
            'user_count': user_count
        }
        
        return render(request, "admin_page/analytics.html", context)

    except Exception as e:
        print("Error fetching analytics:", e)
        return render(request, "admin_page/analytics.html", {
            'active_count': 0, 'total_count': 0, 'user_count': 0
        })


def analytics_json(request):
    """Return key analytics numbers as JSON for AJAX consumption."""
    try:
        total_res = supabase.table("posts").select("id", count="exact").execute()
        total_count = total_res.count or 0

        now = datetime.now().isoformat()
        active_res = supabase.table("posts").select("id", count="exact").gte("deadline", now).execute()
        active_count = active_res.count or 0

        try:
            user_res = supabase.table("users").select("id", count="exact").execute()
            user_count = user_res.count or 0
        except:
            user_count = 0

        # Pending applications
        try:
            pending_res = supabase.table("applications").select("id", count="exact").eq("status", "Pending").execute()
            pending_count = pending_res.count or 0
        except:
            pending_count = 0

        return JsonResponse({
            "success": True,
            "total_count": total_count,
            "active_count": active_count,
            "user_count": user_count,
            "pending_count": pending_count,
        })
    except Exception as e:
        print("ERROR analytics_json:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# NOTE: applications_trends_json previously provided a time-series for charts.
# It was removed per request to no longer show trends/charts in the admin UI.

@csrf_exempt
@student_required
def submit_requirements(request, post_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)

    try:
        # Convert post_id (UUID object) → string
        post_id = str(post_id)

        # Get user UUID from session and convert to string
        user_id = request.session.get("supabase_user_id")
        if not user_id:
            return JsonResponse({"success": False, "error": "User not logged in"}, status=400)

        user_id = str(user_id)

        body = json.loads(request.body.decode("utf-8"))
        reqs = body.get("requirements", [])

        # Validate post exists
        post_check = (
            supabase.table("posts")
            .select("id")
            .eq("id", post_id)
            .single()
            .execute()
        )

        if not post_check.data:
            return JsonResponse({"success": False, "error": "Post not found"}, status=404)

        # Check if application exists
        existing = (
            supabase.table("applications")
            .select("id")
            .eq("user_id", user_id)
            .eq("post_id", post_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            # User already applied - return error for toast
            return JsonResponse({
                "success": False, 
                "error": "You have already applied to this scholarship.",
                "show_toast": True
            }, status=400)
        
        # Create new application
        new_app = (
            supabase.table("applications")
            .insert({
                "user_id": user_id,
                "post_id": post_id,
                "status": "Pending",
            })
            .execute()
        )
        application_id = new_app.data[0]["id"]

        # Insert requirement files
        for req in reqs:
            supabase.table("application_files").insert({
                "application_id": application_id,
                "requirement_name": req["name"],
                "file_url": req["file_url"],
            }).execute()

        return JsonResponse({"success": True, "redirect": "/applications/"})

    except Exception as e:
        print("SUBMIT ERROR:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)




# ------------------------------
# ADMIN: APPLICATIONS
# ------------------------------

def admin_applications_view(request):
    try:
        apps = (
            supabase.table("applications")
            .select("*")
            .order("id", desc=True)
            .execute()
            .data or []
        )

        formatted = []

        for app in apps:

            # 🛑 Skip records with invalid post_id (must be UUID)
            if not app["post_id"] or len(str(app["post_id"])) != 36:
                print("Skipping invalid application:", app)
                continue

            user_uuid = app["user_id"]  # UUID string

            # Fetch Supabase user
            user = (
                supabase.table("users")
                .select("*")
                .eq("id", user_uuid)
                .maybe_single()
                .execute()
                .data
            )

            if not user:
                print("User not found for:", user_uuid)
                continue

            # Build full name
            user["full_name"] = f"{user.get('first_name','')} {user.get('last_name','')}".strip()

            # Fetch the post
            post = (
                supabase.table("posts")
                .select("*")
                .eq("id", app["post_id"])
                .maybe_single()
                .execute()
                .data
            )

            formatted.append({
                "id": app["id"],
                "status": app.get("status", "Pending"),
                "created_at": app.get("created_at"),
                "user": user,
                "post": post,
            })

        return render(request, "admin_page/applications.html", {"applications": formatted})

    except Exception as e:
        print("ADMIN APPLICATIONS ERROR:", e)
        return render(request, "admin_page/applications.html", {"applications": []})


def applications_json(request):
    """Return a JSON list of applications with user and post metadata for the admin UI."""
    try:
        apps = (
            supabase.table("applications")
            .select("*")
            .order("id", desc=True)
            .execute()
            .data or []
        )

        formatted = []

        for app in apps:
            # Validate post_id
            if not app.get("post_id") or len(str(app.get("post_id"))) != 36:
                continue

            # -----------------------------
            # SAFE USER FETCH
            # -----------------------------
            user_res = (
                supabase.table("users")
                .select("*")
                .eq("id", app.get("user_id"))
                .maybe_single()
                .execute()
            )

            if not user_res or not user_res.data:
                # Skip if user not found
                continue

            user = user_res.data

            full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()

            # -----------------------------
            # SAFE POST FETCH
            # -----------------------------
            post_res = (
                supabase.table("posts")
                .select("*")
                .eq("id", app.get("post_id"))
                .maybe_single()
                .execute()
            )

            if not post_res or not post_res.data:
                # Skip if post not found
                continue

            post = post_res.data

            formatted.append({
                "id": app.get("id"),
                "status": app.get("status", "Pending"),
                "created_at": app.get("created_at"),
                "user": {
                    "id": user.get("id"),
                    "full_name": full_name,
                    "email": user.get("email")
                },
                "post": {
                    "id": post.get("id"),
                    "title": post.get("title")
                },
            })

        return JsonResponse({"success": True, "data": formatted})

    except Exception as e:
        print("ERROR applications_json:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)





def admin_view_application(request, app_id):

    app = (
        supabase.table("applications")
        .select("*")
        .eq("id", app_id)
        .single()
        .execute()
        .data
    )

    if not app:
        messages.error(request, "Application not found.")
        return redirect("admin_applications")

    user = (
        supabase.table("users")
        .select("*")
        .eq("id", app["user_id"])
        .single()
        .execute()
        .data
    )

    # ⭐ ADD FULL NAME HERE ALSO
    full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    user["full_name"] = full_name

    post = (
        supabase.table("posts")
        .select("*")
        .eq("id", app["post_id"])
        .single()
        .execute()
        .data
    )

    files = (
        supabase.table("application_files")
        .select("*")
        .eq("application_id", app_id)
        .execute()
        .data
        or []
    )

    return render(request, "admin_page/application_view.html", {
        "app": app,
        "user": user,
        "post": post,
        "files": files,
    })


def admin_view_application_json(request, app_id):
    """Return application details as JSON for in-page viewing (AJAX)."""
    try:
        app = (
            supabase.table("applications")
            .select("*")
            .eq("id", app_id)
            .single()
            .execute()
            .data
        )

        if not app:
            return JsonResponse({"success": False, "error": "Application not found."}, status=404)

        user = (
            supabase.table("users")
            .select("*")
            .eq("id", app["user_id"])
            .single()
            .execute()
            .data
        ) or {}

        user_full_name = f"{user.get('first_name','')} {user.get('last_name','')}".strip()
        user["full_name"] = user_full_name

        post = (
            supabase.table("posts")
            .select("*")
            .eq("id", app["post_id"])
            .single()
            .execute()
            .data
        ) or {}

        files = (
            supabase.table("application_files")
            .select("*")
            .eq("application_id", app_id)
            .execute()
            .data
        ) or []

        return JsonResponse({
            "success": True,
            "app": {
                "id": app.get("id"),
                "status": app.get("status"),
                "created_at": app.get("created_at"),
            },
            "user": user,
            "post": post,
            "files": files,
        })

    except Exception as e:
        print("ERROR admin_view_application_json:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)



def admin_approve_application(request, app_id):
    if request.method == "POST":
        supabase.table("applications").update({"status": "Approved"}).eq("id", app_id).execute()
        messages.success(request, "Application approved.")
        return redirect("admin_applications")


def admin_reject_application(request, app_id):
    if request.method == "POST":
        supabase.table("applications").update({"status": "Rejected"}).eq("id", app_id).execute()
        messages.success(request, "Application rejected.")
        return redirect("admin_applications")

def users_json(request):
    try:
        # Fetch all users from Supabase
        users = (
            supabase.table("users")
            .select("*")
            .order("created_at", desc=True)
            .execute()
            .data or []
        )

        formatted = []

        for u in users:
            user_id = u.get("id")

            # Count this user's applications
            apps = (
                supabase.table("applications")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute()
            )

            applications_count = apps.count or 0

            formatted.append({
                "id": user_id,
                "first_name": u.get("first_name", ""),
                "last_name": u.get("last_name", ""),
                "email": u.get("email", ""),
                "user_role": u.get("user_role", "student"),
                "created_at": u.get("created_at", ""),
                "applications_count": applications_count,
                "is_active": u.get("is_active", True),
            })

        return JsonResponse({"success": True, "data": formatted})

    except Exception as e:
        print("USERS_JSON ERROR:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
def suspend_user(request, user_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)

    try:
        print(f"Suspending user: {user_id}")
        # Mark user as suspended
        result = supabase.table("users").update({"is_active": False}).eq("id", user_id).execute()
        print(f"Suspend result: {result.data}")
        return JsonResponse({"success": True})

    except Exception as e:
        print("SUSPEND USER ERROR:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
def unsuspend_user(request, user_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)

    try:
        print(f"Unsuspending user: {user_id}")
        result = supabase.table("users").update({"is_active": True}).eq("id", str(user_id)).execute()
        print(f"Unsuspend result: {result.data}")
        return JsonResponse({"success": True})

    except Exception as e:
        print("UNSUSPEND USER ERROR:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
def update_user_role(request, user_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        new_role = data.get("role")
        
        if new_role not in ["student", "admin"]:
            return JsonResponse({"success": False, "error": "Invalid role"}, status=400)
        
        supabase.table("users").update({"user_role": new_role}).eq("id", user_id).execute()
        return JsonResponse({"success": True, "role": new_role})

    except Exception as e:
        print("UPDATE USER ROLE ERROR:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)
