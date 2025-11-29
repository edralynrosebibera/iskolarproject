// Admin dashboard JS: profile toggle and small utilities
(function(){
  function debounce(fn, delay){
    let t;
    return function(){
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), delay || 200);
    };
  }

  document.addEventListener('DOMContentLoaded', function(){
    const profileToggle = document.getElementById('profileToggle');
    // If a dropdown exists, wire it. Template may not include a dropdown yet.
    const profileDropdown = document.getElementById('profileDropdown') || document.querySelector('.profile-dropdown');

    if (profileToggle && profileDropdown){
      profileToggle.addEventListener('click', function(e){
        e.stopPropagation();
        const shown = profileDropdown.style.display === 'block';
        profileDropdown.style.display = shown ? 'none' : 'block';
        profileToggle.setAttribute('aria-expanded', String(!shown));
      });

      profileDropdown.addEventListener('click', function(e){ e.stopPropagation(); });

      document.addEventListener('click', function(){ profileDropdown.style.display = 'none'; profileToggle.setAttribute('aria-expanded','false'); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') profileDropdown.style.display = 'none'; });
    }

    // Optional: simple client-side filtering for the search input that highlights matches
    const searchInput = document.querySelector('.search-input');
    if (searchInput){
      const cardsRoot = document.querySelector('.overview') || document.body;
      const cardsSelector = '.scholarship-card, .application-item';
      const applyFilter = debounce(function(e){
        const q = (e.target.value || '').trim().toLowerCase();
        if (!q){
          document.querySelectorAll(cardsSelector).forEach(c=>c.style.display='');
          return;
        }
        document.querySelectorAll(cardsSelector).forEach(c=>{
          const text = (c.textContent||'').toLowerCase();
          c.style.display = text.includes(q) ? '' : 'none';
        });
      }, 180);
      searchInput.addEventListener('input', applyFilter);
    }
    
    // Make admin tabs clickable: set active state and update hash
    const adminTabs = document.querySelectorAll('.admin-tab');
    if (adminTabs && adminTabs.length) {
      for (const tab of adminTabs) {
        tab.addEventListener('click', function (e) {
          // remove active from others
          for (const t of adminTabs) t.classList.remove('active');
          tab.classList.add('active');
          // set aria-current
          for (const t of adminTabs) t.setAttribute('aria-current', t === tab ? 'true' : 'false');
          // set location hash to the tab name (slugified)
          const text = (tab.textContent || '').trim().toLowerCase().replace(/\s+/g, '-');
          try { history.replaceState && history.replaceState(null, '', '#' + text); } catch (err) {}
          // Optionally, scroll top of page to show header
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
  });
})();