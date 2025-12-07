from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.conf import settings
from supabase import create_client, Client


url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

def login_view(request):
    if request.method == "POST":
        request.session.flush()
        username = request.POST.get("username")
        password = request.POST.get("password")

        # -------------------------
        # A) ADMIN LOGIN
        # -------------------------
        if username == "iskolarAdmin@gmail.com" and password == "IskolarAdmin123456":

            admin_user, created = User.objects.get_or_create(
                username=username,
                email=username,
                is_staff=True,
                is_superuser=True
            )

            if created:
                admin_user.set_password(password)
                admin_user.save()

            login(request, admin_user)

            request.session["is_admin"] = True
            request.session["django_user_id"] = admin_user.id
            request.session["supabase_user_id"] = None
            request.session["user_email"] = admin_user.email
            request.session["user_fullname"] = "Iskolar Admin"

            return redirect("posts")

        # -------------------------
        # B) SUPABASE LOGIN
        # -------------------------
        try:
            response = supabase.auth.sign_in_with_password({
                "email": username,
                "password": password
            })

            # Invalid Supabase credentials
            if not response.user:
                messages.error(request, "Invalid credentials.")
                return redirect("login")

            # User not verified yet
            if not response.user.confirmed_at:
                messages.error(request, "Please verify your email before logging in.")
                return redirect("login")

            sb_uuid = str(response.user.id)

            # Fetch profile from Supabase 'users' table
            sb_user = (
                supabase.table("users")
                .select("*")
                .eq("id", sb_uuid)
                .maybe_single()
                .execute()
                .data
            )

            # First login? Insert user in Supabase table
            if not sb_user:
                sb_user = supabase.table("users").insert({
                    "id": sb_uuid,
                    "email": username,
                    "first_name": response.user.user_metadata.get("first_name", ""),
                    "last_name": response.user.user_metadata.get("last_name", ""),
                    "user_role": "student"
                }).execute().data[0]

            # Mirror user in Django
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": username}
            )

            # IMPORTANT: Always update password
            user.set_password(password)
            user.first_name = sb_user.get("first_name", "")
            user.last_name = sb_user.get("last_name", "")
            user.save()

            # Log them in Django
            login(request, user)

            # Store session variables
            request.session["is_admin"] = False
            request.session["django_user_id"] = user.id
            request.session["supabase_user_id"] = sb_uuid
            request.session["user_email"] = username
            request.session["user_fullname"] = f"{sb_user.get('first_name','')} {sb_user.get('last_name','')}".strip()

            return redirect("homepage")

        except Exception as e:
            print("SUPABASE LOGIN ERROR:", e)
            messages.error(request, "Invalid credentials.")
            return redirect("login")

    return render(request, "login/login.html")




def forgot_view(request):
    return render(request, "login/forgot.html")

