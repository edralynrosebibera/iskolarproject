import re
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from supabase import create_client, Client
from django.conf import settings

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

        # --- VALIDATIONS ---
        if not (first_name and first_name[0].isupper()):
            messages.error(request, "First name must start with a capital letter.")
            return redirect("signup")

        if not (last_name and last_name[0].isupper()):
            messages.error(request, "Last name must start with a capital letter.")
            return redirect("signup")

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            messages.error(request, "Please enter a valid email address.")
            return redirect("signup")

        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return redirect("signup")

        if len(password1) < 8 or not re.search(r"[A-Za-z]", password1) or not re.search(r"[0-9]", password1) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password1):
            messages.error(request, "Password must meet complexity requirements.")
            return redirect("signup")

        # Django duplicate prevent
        if User.objects.filter(username=email).exists():
            messages.error(request, "An account with this email already exists.")
            return redirect("signup")

        try:
            # Create Supabase Auth account
            response = supabase.auth.sign_up({
                "email": email,
                "password": password1,
                "options": {
                    "email_redirect_to": "https://iskolarproject-340j.onrender.com/login/"
                }
            })

            if not response.user:
                messages.error(request, "Signup failed. Try again.")
                return redirect("signup")

            sb_id = str(response.user.id)

            # Insert into Supabase profile table with default role STUDENT
            try:
                supabase.table("users").insert({
                    "id": sb_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "user_role": "student"  # <-- IMPORTANT
                }).execute()
            except Exception as e:
                print("⚠️ Supabase profile insert failed:", e)

            # Mirror into Django user system
            User.objects.create_user(
                username=email,
                email=email,
                password=password1,
                first_name=first_name,
                last_name=last_name
            )

            messages.success(request, "Account created! Please verify your email before logging in.")
            return redirect("login")

        except Exception as e:
            print("SUPABASE SIGNUP ERROR:", e)
            messages.error(request, "Signup failed. Please try again.")
            return redirect("signup")

    return render(request, "signup/signup.html")






# import re
# from django.shortcuts import render, redirect
# from django.contrib.auth import logout
# from django.contrib.auth.models import User
# from django.contrib import messages
# from supabase import create_client, Client
# from django.conf import settings
# from django.http import JsonResponse

# url: str = settings.SUPABASE_URL
# key: str = settings.SUPABASE_KEY
# supabase: Client = create_client(url, key)

# def signup_view(request):
#     if request.method == "POST":
#         first_name = request.POST.get("first_name")
#         last_name = request.POST.get("last_name")
#         email = request.POST.get("email")
#         password1 = request.POST.get("password1")
#         password2 = request.POST.get("password2")

#         # --- VALIDATIONS (unchanged) ---
#         if not (first_name and first_name[0].isupper()):
#             messages.error(request, "First name must start with a capital letter.")
#             return redirect("signup")
#         if not (last_name and last_name[0].isupper()):
#             messages.error(request, "Last name must start with a capital letter.")
#             return redirect("signup")
#         if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
#             messages.error(request, "Please enter a valid email address.")
#             return redirect("signup")
#         if password1 != password2:
#             messages.error(request, "Passwords do not match.")
#             return redirect("signup")
#         if len(password1) < 8 or not re.search(r"[A-Za-z]", password1) or not re.search(r"[0-9]", password1) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password1):
#             messages.error(request, "Password must meet complexity requirements.")
#             return redirect("signup")

#         # Prevent duplicate Django user
#         if User.objects.filter(username=email).exists():
#             messages.error(request, "An account with this email already exists.")
#             return redirect("signup")

#         try:
#             # 1) Create Supabase Auth user (sends email verification)
#             response = supabase.auth.sign_up({
#                 "email": email,
#                 "password": password1,
#                 "options": {
#                     "email_redirect_to": "https://iskolarproject-340j.onrender.com/login/"
#                 }
#             })

#             if not response.user:
#                 messages.error(request, "Signup failed. Try a different email.")
#                 return redirect("signup")

#             # DO NOT INSERT INTO SUPABASE TABLE YET
#             # DO NOT CREATE DJANGO USER YET

#             messages.success(request, "Account created! A verification link has been sent to your email.")
#             return redirect("login")

#         except Exception as e:
#             messages.error(request, f"Signup failed: {str(e)}")
#             return redirect("signup")

#     return render(request, "signup/signup.html")
 
