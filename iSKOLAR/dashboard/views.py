from django.shortcuts import render

def dashboard_view(request):
    return render(request, "iskolar.html")  # 👈 use the actual file name here
