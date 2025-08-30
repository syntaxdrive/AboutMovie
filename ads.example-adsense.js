// ads.example-adsense.js
// Example: how you would safely load Google AdSense on the production host.
// DO NOT commit your real publisher ID into source control. Create a file named `ads.js` on your host that
// contains the publisher id and the loader. Example below shows the pattern.

(function(){
  // Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your publisher id on the server copy only
  var ADSENSE_PUBLISHER = 'ca-pub-REPLACE_ME';

  // Load AdSense script
  var s = document.createElement('script');
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER;
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.onload = function(){
    // When the library is ready, fill ad slots that follow AdSense's markup.
    if (window && typeof window.registerAdHook === 'function') {
      window.registerAdHook(function fillAds(){
        document.querySelectorAll('.ad-slot').forEach((slot) => {
          // create a basic AdSense ins element — replace data-ad-client/unit as needed for real units
          if (slot.querySelector('ins.adsbygoogle')) return;
          slot.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' + ADSENSE_PUBLISHER + '" data-ad-slot="REPLACE_WITH_YOUR_UNIT" data-ad-format="auto" data-full-width-responsive="true"></ins>';
          try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
        });
      });
    }
  };
  s.onerror = function(){ /* swallow */ };
  document.head.appendChild(s);
})();
// Example AdSense loader template (safe, no real publisher IDs).
// Create a production-only `ads.js` that loads your AdSense code and registers ad render hooks.

(function(){
  // This is a safe demo: do NOT paste your real AdSense snippet here in the repo.
  // Instead, copy this file to `ads.js` on your server and paste your real AdSense loader.

  function renderSlots(){
    // example rendering: replace placeholders with network-rendered content
    document.querySelectorAll('.ad-slot').forEach((el)=>{
      if (el.dataset._rendered) return;
      el.dataset._rendered = '1';
      el.innerHTML = '<div style="padding:12px;">[AdSense ad would render here]</div>';
    });
    document.querySelectorAll('.inline-ad').forEach((el)=>{
      if (el.dataset._rendered) return;
      el.dataset._rendered = '1';
      el.innerHTML = '<div class="ad-inner">[Inline AdSense slot]</div>';
    });
  }

  // register render hook
  if (window.registerAdHook) window.registerAdHook(renderSlots);
  // also run once in case slots are already present
  setTimeout(renderSlots, 150);
})();
