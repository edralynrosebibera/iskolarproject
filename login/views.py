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

            # Ensure backend is set when logging a programmatically-created admin
            admin_user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, admin_user)

            request.session["is_admin"] = True
            request.session["django_user_id"] = admin_user.id
            request.session["supabase_user_id"] = None
            request.session["user_email"] = admin_user.email
            request.session["user_fullname"] = "Iskolar Admin"

            return redirect("posts")

        # ---------------------------------------------------------
        # B) SUPABASE AUTH LOGIN
        # ---------------------------------------------------------
        try:
            response = supabase.auth.sign_in_with_password({
                "email": username,
                "password": password
            })

            # Defensive logging to help debug failures from Supabase
            print("SUPABASE RAW RESPONSE:", response)

            # Support both object-like and dict-like responses
            resp_user = None
            resp_error = None
            try:
                resp_user = getattr(response, "user", None)
            except Exception:
                resp_user = None

            if resp_user is None and isinstance(response, dict):
                resp_user = response.get("user")
                resp_error = response.get("error")

            # If sign-in failed, surface Supabase error message when available
            if not resp_user:
                if resp_error:
                    err_msg = getattr(resp_error, "message", str(resp_error))
                    print("SUPABASE ERROR:", resp_error)
                    messages.error(request, f"Login failed: {err_msg}")
                else:
                    messages.error(request, "Invalid credentials.")
                return redirect("login")

            # Check email verification if the field is present
            if not getattr(resp_user, "email_confirmed_at", None):
                messages.error(request, "Please verify your email before logging in.")
                return redirect("login")

            sb_uuid = str(getattr(resp_user, "id", None) or resp_user.get("id"))

            # Fetch profile from Supabase 'users'
            sb_user = (
                supabase.table("users")
                .select("*")
                .eq("id", sb_uuid)
                .maybe_single()
                .execute()
                .data
            )

            # Insert if first login
            if not sb_user:
                user_metadata = getattr(resp_user, "user_metadata", {}) if resp_user else {}
                first_name = user_metadata.get("first_name", "") if isinstance(user_metadata, dict) else ""
                last_name = user_metadata.get("last_name", "") if isinstance(user_metadata, dict) else ""

                sb_user = supabase.table("users").insert({
                    "id": sb_uuid,
                    "email": username,
                    "first_name": first_name,
                    "last_name": last_name,
                    "user_role": "student"
                }).execute().data[0]

            # Mirror Django user
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": username}
            )

            # Sync Django password and profile fields
            user.set_password(password)
            user.first_name = sb_user.get("first_name", "")
            user.last_name = sb_user.get("last_name", "")
            user.save()

            # Log into Django
            # Ensure backend is set when logging a programmatically-created/updated user
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)

            # STORE CLEAN USER SESSION
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

