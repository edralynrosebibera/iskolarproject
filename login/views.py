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
        username = request.POST.get("username")
        password = request.POST.get("password")

        # ---------------------------------------------------------
        # A) ADMIN LOGIN
        # ---------------------------------------------------------
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

            request.session["django_user_id"] = admin_user.id
            request.session["supabase_user_id"] = None
            request.session["user_email"] = admin_user.email
            request.session["user_fullname"] = "Iskolar Admin"

            return redirect("admin_page")

        # ---------------------------------------------------------
        # B) TRY DJANGO LOGIN
        # ---------------------------------------------------------
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)

            # Try fetching Supabase user profile
            sb_user = (
                supabase.table("users")
                .select("*")
                .eq("email", username)
                .maybe_single()
                .execute()
                .data
            )

            request.session["django_user_id"] = user.id
            request.session["supabase_user_id"] = str(sb_user["id"]) if sb_user else None
            request.session["user_email"] = username
            request.session["user_fullname"] = user.get_full_name() or username

            return redirect("homepage")

        # ---------------------------------------------------------
        # C) TRY SUPABASE LOGIN
        # ---------------------------------------------------------
        try:
            response = supabase.auth.sign_in_with_password({
                "email": username,
                "password": password
            })

            # If login fails in Supabase
            if not response.user:
                messages.error(request, "Invalid credentials or email not verified.")
                return redirect("login")

            # Check email verification status
            if not response.user.confirmed_at:
                messages.error(request, "Please verify your email before logging in.")
                return redirect("login")

            sb_uuid = str(response.user.id)  # UUID as string (important)

            # Fetch profile from your Supabase "users" table
            sb_user = (
                supabase.table("users")
                .select("*")
                .eq("id", sb_uuid)
                .single()
                .execute()
                .data
            )

            # Create Django mirror account if not exists
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": username}
            )

            if created:
                user.set_password(password)
                user.first_name = sb_user.get("first_name", "")
                user.last_name = sb_user.get("last_name", "")
                user.save()

            login(request, user)

            # Save session data
            request.session["django_user_id"] = user.id
            request.session["supabase_user_id"] = sb_uuid
            request.session["user_email"] = username
            request.session["user_fullname"] = f"{sb_user.get('first_name', '')} {sb_user.get('last_name', '')}".strip()

            return redirect("homepage")

        except Exception as e:
            print("SUPABASE LOGIN ERROR:", e)
            messages.error(request, "Invalid credentials or email not verified.")
            return redirect("login")

    return render(request, "login/login.html")


def forgot_view(request):
    return render(request, "login/forgot.html")

