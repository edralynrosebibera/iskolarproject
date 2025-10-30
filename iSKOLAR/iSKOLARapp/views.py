import re
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
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
    return render(request, "iskolar.html")

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        # Special case: Admin login (local hardcoded credentials)
        if username == "iskolarAdmin@gmail.com" and password == "IskolarAdmin123456":
            # Log in or create admin user in Django
            admin_user, created = User.objects.get_or_create(username=username, email=username, is_staff=True, is_superuser=True)
            if created:
                admin_user.set_password(password)
                admin_user.save()
            login(request, admin_user)
            return redirect("admin_page")  

        user = authenticate(request, username=username, password=password)
        if user is None:
            try:
                response = supabase.auth.sign_in_with_password({"email": username, "password": password})
                if response.user:
                    user = User.objects.create_user(username=username, email=username, password=password)
                    login(request, user)
                    return redirect("homepage")
                else:
                    messages.error(request, "Invalid credentials or email not verified.")
                    return redirect("login")
            except Exception:
                messages.error(request, "Invalid credentials or email not verified.")
                return redirect("login")
        else:
            login(request, user)
            return redirect("homepage")
    return render(request, "login.html")

def signup_view(request):
    if request.method == "POST":
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        email = request.POST.get("email")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        # Name validation: must start with capital letter
        if not (first_name and first_name[0].isupper()):
            messages.error(request, "First name must start with a capital letter.")
            return redirect("signup")
        if not (last_name and last_name[0].isupper()):
            messages.error(request, "Last name must start with a capital letter.")
            return redirect("signup")

        # Email format validation
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            messages.error(request, "Please enter a valid email address.")
            return redirect("signup")

        # Password validation
        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return redirect("signup")
        if len(password1) < 8:
            messages.error(request, "Password must be at least 8 characters long.")
            return redirect("signup")
        if not re.search(r"[A-Za-z]", password1):
            messages.error(request, "Password must contain at least one letter.")
            return redirect("signup")
        if not re.search(r"[0-9]", password1):
            messages.error(request, "Password must contain at least one number.")
            return redirect("signup")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password1):
            messages.error(request, "Password must contain at least one special character.")
            return redirect("signup")

        # Check if email already exists locally
        if User.objects.filter(username=email).exists():
            messages.error(request, "An account with this email already exists.")
            return redirect("signup")

        try:
            # Create user in Supabase Auth (this sends email verification)
            response = supabase.auth.sign_up({"email": email, "password": password1})
            if response.user:
                # Insert user data into your custom Supabase 'users' table
                try:
                    supabase.table("users").insert({
                        "id": response.user.id,
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": email,
                        "user_role": "student"
                    }).execute()
                except Exception as e:
                    print("⚠️ Failed to insert into Supabase users table:", e)

                # Create user in Django's local auth table
                User.objects.create_user(
                    username=email,
                    email=email,
                    password=password1,
                    first_name=first_name,
                    last_name=last_name
                )

                # Message for verification
                messages.success(request, "Account created! Please check your email to verify your account before logging in.")
                return redirect("login")
            else:
                messages.error(request, "Signup failed.")
                return redirect("signup")

        except Exception as e:
            messages.error(request, f"Signup failed: {str(e)}")
            return redirect("signup")

    return render(request, "signup.html")


def homepage(request):
    try:
        response = supabase.table("posts").select("*").order("id", desc=True).execute()
        posts = response.data if response.data else []
    except Exception as e:
        print("⚠️ Error fetching posts:", e)
        posts = []

    return render(request, "homepage.html", {"posts": posts})


def profile_view(request):
    return render(request, "profile.html")

def logout_view(request):
    logout(request)
    return redirect("iSKOLARapp")

def forgot_view(request):
    return render(request, "forgot.html")
def view_profile(request):
    return render(request, 'view-profile.html')

def archives_view(request):
    return render(request, "archives.html")

def applications_view(request):
    return render(request, "applications.html")

def saved_scholarships_view(request):
    return render(request, "saved_scholarships.html")

def admin_view(request):
    return render(request, "admin.html")

from django.http import JsonResponse

# def get_scholarships(request):
#     try:
#         response = supabase.table("posts").select("*").execute()
#         posts = response.data if response.data else []
#         return JsonResponse({"posts": posts})
#     except Exception as e:
#         print("⚠️ Error fetching posts:", e)
#         return JsonResponse({"posts": []}, status=500)

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
            }).execute()
            return JsonResponse({"success": True, "data": res.data})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    
    # ✅ If GET request, render the HTML form page
    return render(request, "create-post.html")

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
#                 "link": post.get("scholarship_link"),  # ✅ renamed for frontend compatibility
#                 "created_at": post.get("created_at")
#             })
#         return JsonResponse({"success": True, "data": posts})
#     except Exception as e:
#         return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
def get_posts_view(request):
    try:
        data = supabase.table("posts").select("*").order("id", desc=True).execute()
        posts = []
        for post in data.data:
            posts.append({
                "id": post.get("id"),
                "title": post.get("title"),
                "description": post.get("description"),
                "location": post.get("location"),
                "qualifications": post.get("qualifications"),
                "deadline": post.get("deadline"),
                "link": post.get("scholarship_link"),  # ✅ renamed for frontend compatibility
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

            res = supabase.table("posts").update({
                "title": data.get("title"),
                "description": data.get("description"),
                "location": data.get("location"),
                "qualifications": data.get("qualifications"),
                "deadline": data.get("deadline"),
                "scholarship_link": data.get("scholarshipLink"),  
            }).eq("id", post_id).execute()

            if not res.data:
                return JsonResponse({"success": False, "error": "Post not found or not updated."})
            return JsonResponse({"success": True})
        except Exception as e:
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

@csrf_exempt
def search_posts_view(request):
    query = request.GET.get("q", "")
    try:
        response = supabase.table("posts").select("*").ilike("title", f"%{query}%").execute()
        return JsonResponse({"success": True, "data": response.data})
    except Exception as e:
        print("⚠️ Search error:", e)
        return JsonResponse({"success": False, "error": str(e)})


def posts_view(request):
    return render(request, "posts.html")


