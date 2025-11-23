// Simple script to handle the back button
function goBack() {
    // This goes back to the previous page in history (usually the dashboard)
    window.history.back();
    
    // Fallback: If history is empty, force redirect to posts
    setTimeout(() => {
        window.location.href = "/posts/"; 
    }, 500);
}

// Optional: You can add console logs to check if the page loaded
console.log("Analytics Dashboard Loaded");