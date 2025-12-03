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

            # SAVE ADMIN SESSION (Django ID OK)
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

            # ❗ FETCH SUPABASE USER UUID USING EMAIL
            sb_user = (
                supabase.table("users")
                .select("*")
                .eq("email", username)
                .maybe_single()
                .execute()
                .data
            )

            # SAVE BOTH
            request.session["django_user_id"] = user.id
            request.session["supabase_user_id"] = sb_user["id"] if sb_user else None
            request.session["user_email"] = user.email
            request.session["user_fullname"] = user.get_full_name() or user.username

            return redirect("homepage")

        # ---------------------------------------------------------
        # C) TRY SUPABASE LOGIN
        # ---------------------------------------------------------
        try:
            response = supabase.auth.sign_in_with_password({
                "email": username,
                "password": password
            })

            if response.user:

                # FETCH user data from Supabase DB
                sb_user = (
                    supabase.table("users")
                    .select("*")
                    .eq("email", username)
                    .single()
                    .execute()
                    .data
                )

                # CREATE MIRROR DJANGO USER
                user = User.objects.create_user(
                    username=username,
                    email=username,
                    password=password
                )
                login(request, user)

                # SAVE BOTH IDs
                request.session["django_user_id"] = user.id
                request.session["supabase_user_id"] = sb_user["id"]  # UUID
                request.session["user_email"] = username
                request.session["user_fullname"] = sb_user.get("first_name", username)

                return redirect("homepage")

            else:
                messages.error(request, "Invalid credentials or email not verified.")
                return redirect("login")

        except Exception:
            messages.error(request, "Invalid credentials or email not verified.")
            return redirect("login")

    return render(request, "login/login.html")



def forgot_view(request):
    return render(request, "login/forgot.html")

