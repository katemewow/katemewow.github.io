(() => {
  "use strict";
  const header = document.querySelector(".site-header");
  if (header) {
    const syncHeaderHeight = () => document.documentElement.style.setProperty("--header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    syncHeaderHeight();
    if ("ResizeObserver" in window) new ResizeObserver(syncHeaderHeight).observe(header);
    window.addEventListener("resize", syncHeaderHeight, { passive: true });
  }
  // Show FAQ answers in a printed copy, then restore their previous state.
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  let openBeforePrint = [];
  window.addEventListener("beforeprint", () => {
    openBeforePrint = faqItems.map(item => item.open);
    faqItems.forEach(item => { item.open = true; });
  });
  window.addEventListener("afterprint", () => faqItems.forEach((item, i) => { item.open = openBeforePrint[i] || false; }));

  const post = window.STORY_CONFIG?.MAIN_POST_URL?.trim();
  if (post) {
    try {
      const url = new URL(post);
      if (["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)
          && url.protocol === "https:" && /^\/katemewow\/status\/\d+\/?$/i.test(url.pathname)) {
        document.querySelectorAll(".main-post").forEach(link => {
          link.href = url.href;
          link.textContent = "my post about this story on X";
        });
      }
    } catch (_) { /* Keep the profile link if the configured URL is invalid. */ }
  }

  // In the single-file preview, open full-resolution screenshots using
  // native browser image viewing, without a custom lightbox or extra UI.
  const imageUrls = [];
  document.querySelectorAll('a.screenshot[href^="data:image/"]').forEach(link => {
    const comma = link.href.indexOf(",");
    const mime = link.href.slice(5, link.href.indexOf(";"));
    const raw = atob(link.href.slice(comma + 1));
    const bytes = Uint8Array.from(raw, ch => ch.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    link.href = url;
    imageUrls.push(url);
  });
  window.addEventListener("pagehide", () => imageUrls.forEach(url => URL.revokeObjectURL(url)), { once: true });

  const share = document.querySelector("a.share-page");
  if (!share) return;
  const local = !["http:", "https:"].includes(location.protocol)
      || ["localhost", "127.0.0.1"].includes(location.hostname);
  if (!local) share.href = location.origin + location.pathname;
  share.addEventListener("click", async event => {
    event.preventDefault();
    const original = share.textContent;
    if (local) {
      share.textContent = "sharing will be available after publication";
      setTimeout(() => { share.textContent = original; }, 2500);
      return;
    }
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.querySelector("h1").textContent, url });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        share.textContent = "link copied";
        setTimeout(() => { share.textContent = original; }, 2000);
      } else {
        window.prompt("Copy this page’s address:", url);
      }
    } catch (error) {
      if (error.name !== "AbortError") window.prompt("Copy this page’s address:", url);
    }
  });
})();
