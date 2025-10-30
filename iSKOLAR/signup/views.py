import re
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib import messages
from supabase import create_client, Client
from django.conf import settings
from django.http import JsonResponse

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

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

    return render(request, "signup/signup.html")