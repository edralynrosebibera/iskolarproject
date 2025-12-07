from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
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

        # Reset session
        request.session.flush()

        # ------------------------------------
        # A) TRY DJANGO LOGIN FIRST
        # ------------------------------------
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)

            sb_user = (
                supabase.table("users")
                .select("*")
                .eq("email", username)
                .maybe_single()
                .execute()
                .data
            )

            role = sb_user.get("user_role", "student") if sb_user else "student"

            # store session data
            request.session["django_user_id"] = user.id
            request.session["supabase_user_id"] = str(sb_user["id"]) if sb_user else None
            request.session["user_email"] = username
            request.session["user_fullname"] = user.get_full_name() or username
            request.session["user_role"] = role

            return redirect("posts" if role == "admin" else "homepage")

        # ------------------------------------
        # B) TRY SUPABASE AUTH LOGIN
        # ------------------------------------
        try:
            response = supabase.auth.sign_in_with_password({
                "email": username,
                "password": password
            })

            auth_user = supabase.auth.get_user()

            if not auth_user or not auth_user.user:
                messages.error(request, "Invalid credentials.")
                return redirect("login")

            user_data = auth_user.user

            # Ensure email is verified
            if not user_data.confirmed_at:
                messages.error(request, "Please verify your email before logging in.")
                return redirect("login")

            sb_uuid = str(user_data.id)

            # Fetch profile record
            sb_profile = (
                supabase.table("users")
                .select("*")
                .eq("id", sb_uuid)
                .maybe_single()
                .execute()
                .data
            )

            # If profile missing, create one
            if not sb_profile:
                sb_profile = (
                    supabase.table("users")
                    .insert({
                        "id": sb_uuid,
                        "first_name": "",
                        "last_name": "",
                        "email": username,
                        "user_role": "student"
                    })
                    .execute()
                    .data[0]
                )

            role = sb_profile.get("user_role", "student")

            # Mirror profile into Django user model
            django_user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": username}
            )

            # Always sync names + password
            django_user.first_name = sb_profile.get("first_name", "")
            django_user.last_name = sb_profile.get("last_name", "")
            django_user.set_password(password)
            django_user.save()

            login(request, django_user)

            # store session data
            request.session["django_user_id"] = django_user.id
            request.session["supabase_user_id"] = sb_uuid
            request.session["user_email"] = username
            request.session["user_fullname"] = f"{sb_profile.get('first_name','')} {sb_profile.get('last_name','')}".strip()
            request.session["user_role"] = role

            return redirect("posts" if role == "admin" else "homepage")

        except Exception as e:
            print("SUPABASE LOGIN ERROR:", e)
            messages.error(request, "Login failed.")
            return redirect("login")

    return render(request, "login/login.html")




# from django.shortcuts import render, redirect
# from django.contrib.auth import authenticate, login, logout
# from django.contrib.auth.models import User
# from django.contrib import messages
# from django.conf import settings
# from supabase import create_client, Client


# url: str = settings.SUPABASE_URL
# key: str = settings.SUPABASE_KEY
# supabase: Client = create_client(url, key)

# def login_view(request):
#     if request.method == "POST":
#         username = request.POST.get("username")
#         password = request.POST.get("password")
#         request.session.flush()

#         # ---------------------------------------------------------
#         # A) ADMIN LOGIN
#         # ---------------------------------------------------------
#         if username == "iskolarAdmin@gmail.com" and password == "IskolarAdmin123456":

#             admin_user, created = User.objects.get_or_create(
#                 username=username,
#                 email=username,
#                 is_staff=True,
#                 is_superuser=True
#             )

#             if created:
#                 admin_user.set_password(password)
#                 admin_user.save()

#             login(request, admin_user)

#             request.session["django_user_id"] = admin_user.id
#             request.session["supabase_user_id"] = None
#             request.session["user_email"] = admin_user.email
#             request.session["user_fullname"] = "Iskolar Admin"

#             return redirect("posts")

#         # ---------------------------------------------------------
#         # B) TRY DJANGO LOGIN
#         # ---------------------------------------------------------
#         user = authenticate(request, username=username, password=password)

#         if user is not None:
#             login(request, user)

#             sb_user = (
#                 supabase.table("users")
#                 .select("*")
#                 .eq("email", username)
#                 .maybe_single()
#                 .execute()
#                 .data
#             )

#             request.session["django_user_id"] = user.id
#             request.session["supabase_user_id"] = str(sb_user["id"]) if sb_user else None
#             request.session["user_email"] = username
#             request.session["user_fullname"] = user.get_full_name() or username

#             return redirect("homepage")

#         # ---------------------------------------------------------
#         # C) TRY SUPABASE LOGIN
#         # ---------------------------------------------------------
#         try:
#             # 1) Login with email & password
#             response = supabase.auth.sign_in_with_password({
#                 "email": username,
#                 "password": password
#             })

#             # 2) Get authenticated user from Supabase session
#             auth_user = supabase.auth.get_user()

#             if not auth_user or not auth_user.user:
#                 messages.error(request, "Invalid credentials.")
#                 return redirect("login")

#             user_data = auth_user.user

#             # 3) Check email verification
#             if not user_data.confirmed_at:
#                 messages.error(request, "Please verify your email before logging in.")
#                 return redirect("login")

#             sb_uuid = str(user_data.id)

#             # 4) Fetch user profile from YOUR profile table
#             sb_profile = (
#                 supabase.table("users")
#                 .select("*")
#                 .eq("id", sb_uuid)
#                 .maybe_single()
#                 .execute()
#                 .data
#             ) or {}

#             # 5) Mirror into Django user
#             django_user, created = User.objects.get_or_create(
#                 username=username,
#                 defaults={"email": username}
#             )

#             if created:
#                 django_user.set_password(password)
#                 django_user.first_name = sb_profile.get("first_name", "")
#                 django_user.last_name = sb_profile.get("last_name", "")
#                 django_user.save()

#             login(request, django_user)

#             # 6) Save session
#             request.session["django_user_id"] = django_user.id
#             request.session["supabase_user_id"] = sb_uuid
#             request.session["user_email"] = username
#             request.session["user_fullname"] = f"{sb_profile.get('first_name','')} {sb_profile.get('last_name','')}".strip()

#             return redirect("homepage")

#         except Exception as e:
#             print("SUPABASE LOGIN ERROR:", e)
#             messages.error(request, "Login failed.")
#             return redirect("login")

#     return render(request, "login/login.html")



# def forgot_view(request):
#     return render(request, "login/forgot.html")
