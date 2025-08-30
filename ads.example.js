// ads.example.js
// Safe local example ad loader — place a production `ads.js` on your host (do NOT commit real ad code to git).
// This script demonstrates how to register with the site's ad hook API and render content into ad slots.
(function(){
  function renderAdSlots() {
    // simple placeholder renderer — a real ad loader would call network SDKs
    document.querySelectorAll('.ad-slot').forEach((slot, i) => {
      if (slot.dataset.__filled) return;
      slot.innerHTML = `<div class="ad-placeholder">Ad placeholder #${i+1}</div>`;
      slot.dataset.__filled = '1';
    });

    document.querySelectorAll('.inline-ad').forEach((slot, i) => {
      if (slot.dataset.__filled) return;
      slot.innerHTML = `<div class="ad-inline">Inline ad placeholder</div>`;
      slot.dataset.__filled = '1';
    });
  }

  // register with the page's ad hook system
  if (window && typeof window.registerAdHook === 'function') {
    window.registerAdHook(renderAdSlots);
    // run immediately in case slots are already present
    setTimeout(renderAdSlots, 100);
  } else {
    // fallback: run once DOM ready
    document.addEventListener('DOMContentLoaded', renderAdSlots);
  }
})();
// Example ads loader template for AdSense-like networks.
// Copy this file to `ads.js` and add your network initialization code.
// This file demonstrates registering an ad hook and rendering simple placeholders.

(function(){
  // register an ad hook that will run whenever ad slots are inserted
  window.registerAdHook(function(){
    // find ad slots and replace placeholder text with network code
    document.querySelectorAll('.ad-slot').forEach((el)=>{
      if (el.dataset._rendered) return;
      el.dataset._rendered = '1';
      // Example: insert a safe placeholder. Replace with real ad network calls.
      el.innerHTML = '<div style="padding:8px;color:#333">[Ad network would render here]</div>';
    });
    document.querySelectorAll('.inline-ad').forEach((el)=>{
      if (el.dataset._rendered) return;
      el.dataset._rendered = '1';
      el.innerHTML = '<div class="ad-inner">[Inline Ad slot]</div>';
    });
  });
})();
