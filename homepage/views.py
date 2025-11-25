import re
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib import messages
from supabase import create_client, Client
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
from datetime import datetime, timezone

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_KEY
supabase: Client = create_client(url, key)

def homepage_view(request):
    try:
        response = supabase.table("posts").select("*").order("id", desc=True).execute()
        posts = response.data if response.data else []
    except Exception as e:
        print("⚠️ Error fetching posts:", e)
        posts = []
    # helper to parse ISO-ish datetime strings returned by Supabase
    def _parse_dt(s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s)
        except Exception:
            try:
                return datetime.fromisoformat(s.replace('Z', '+00:00'))
            except Exception:
                return None

    # Auto-archive expired posts so they do not appear on the homepage
    try:
        now = datetime.now(timezone.utc)
        expired_ids = []
        for p in posts:
            d = _parse_dt(p.get('deadline'))
            if d is None:
                continue
            # make timezone-aware for comparison
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            if d < now and not p.get('is_archived'):
                expired_ids.append(p.get('id'))

        if expired_ids:
            # persist archival in Supabase
            for pid in expired_ids:
                try:
                    supabase.table('posts').update({'is_archived': True}).eq('id', pid).execute()
                except Exception as e:
                    print('⚠️ Failed to archive post', pid, e)
            # remove archived items from the list so template doesn't render them
            posts = [p for p in posts if p.get('id') not in expired_ids]
    except Exception as e:
        print('⚠️ Error while auto-archiving expired posts:', e)

    return render(request, "homepage/homepage.html", {"posts": posts})
