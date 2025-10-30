from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from supabase import create_client, Client
import json

# Initialize Supabase
url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

# Admin HTML page
def admin_view(request):
    return render(request, "admin_page/admin.html")

# Create post view
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

    return render(request, "admin_page/create-post.html")

# Get posts view
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
                "link": post.get("scholarship_link"),
                "created_at": post.get("created_at")
            })
        return JsonResponse({"success": True, "data": posts})
    except Exception as e:
        print("⚠️ Error fetching posts:", e)
        return JsonResponse({"success": False, "error": str(e)})

# Edit post
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

# Delete post
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

# Posts page
def posts_view(request):
    return render(request, "admin_page/posts.html")
