// ── Sidebar: expand chapter on click (no page reload) ──
document.querySelectorAll('.nav-chapter').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var hasSubs = this.classList.contains('has-subs');
    if (hasSubs) {
      // Chapters with a submenu: clicking only expands/collapses.
      e.preventDefault();
      var li = this.closest('li');
      if (li) li.classList.toggle('expanded');
    }
    // Chapters without a submenu navigate normally (no toggle, no reload of layout).
  });
});
});

// ── Search / filter navigation ──
function filterNav(query) {
  query = query.toLowerCase().trim();
  // Persist across page navigations
  sessionStorage.setItem('caldeira-search', query);
  var links = document.querySelectorAll('.nav-tree a');
  links.forEach(function(link) {
    var text = link.textContent.toLowerCase();
    var li = link.closest('li');
    if (!query || text.indexOf(query) !== -1) {
      if (li) li.style.display = '';
      // Show all ancestor <li> elements
      var p = li.parentElement;
      while (p && p.tagName === 'UL') {
        var parentLi = p.closest('li');
        if (parentLi) parentLi.style.display = '';
        p = parentLi ? parentLi.parentElement : null;
      }
      if (query) {
        var parent = link.closest('.nav-tree > li');
        if (parent) parent.classList.add('expanded');
      }
    } else {
      if (li) li.style.display = 'none';
    }
  });
}

// Restore saved search on page load
(function() {
  var saved = sessionStorage.getItem('caldeira-search');
  if (saved) {
    var input = document.getElementById('nav-search');
    if (input) {
      input.value = saved;
      filterNav(saved);
    }
  }
})();

// ── Copy code from example blocks ──
function copyCode(btn) {
  var code = btn.parentElement.querySelector('code');
  if (!code) return;
  var text = code.textContent;
  if (navigator.clipboard) {
	    navigator.clipboard.writeText(text).then(function() {
	      btn.innerHTML = '<span class="material-icons" style="font-size:0.8rem">check</span>';
	      setTimeout(function() { btn.innerHTML = '<span class="material-icons" style="font-size:0.8rem">content_copy</span>'; }, 1500);
    });
  } else {
    // fallback
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.innerHTML = '<span class="material-icons" style="font-size:0.8rem">check</span>';
    setTimeout(function() { btn.innerHTML = '<span class="material-icons" style="font-size:0.8rem">content_copy</span>'; }, 1500);
  }
}

// ── Carousel: move one slide at a time ──
function carouselMove(id, dir) {
  var track = document.getElementById(id + '-track');
  var ctr = document.getElementById(id + '-ctr');
  if (!track) return;
  // Chiudi tutti gli esempi aperti prima di muovere
  track.querySelectorAll('details[open]').forEach(function(d) { d.removeAttribute('open'); });
  var slides = track.querySelectorAll('.carousel-slide');
  var total = slides.length;
  if (total === 0) return;
  var idx = parseInt(track.dataset.idx || '0', 10);
  idx = (idx + dir + total) % total;
  track.dataset.idx = idx;
  track.style.transform = 'translateX(-' + (idx * 100) + '%)';
  if (ctr) ctr.textContent = (idx + 1) + ' / ' + total;
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.carousel-track').forEach(function(t) { t.dataset.idx = '0'; });
});

// ── Auto-expand current chapter on page load ──
document.addEventListener('DOMContentLoaded', function() {
  var hash = window.location.hash;
  if (hash) {
    var target = document.querySelector('.nav-tree a[href="' + hash + '"]');
    if (target) {
      var chapterLi = target.closest('.nav-tree > li');
      if (chapterLi) chapterLi.classList.add('expanded');
    }
  }
});


// ── Hash-based carousel navigation ──
function _moveCarouselToSlide(slideId) {
  var slide = document.getElementById(slideId);
  if (!slide || !slide.classList.contains('carousel-slide')) return;
  var track = slide.closest('.carousel-track');
  if (!track) return;
  var carousel = track.closest('.carousel');
  if (!carousel) return;

  // Unhide category
  var cat = carousel.closest('.isa-category');
  if (cat) cat.style.display = '';

  // Move carousel
  var slides = track.querySelectorAll('.carousel-slide');
  var idx = Array.from(slides).indexOf(slide);
  if (idx >= 0) {
    track.dataset.idx = idx;
    track.style.transform = 'translateX(' + (idx * -100) + '%)';
    var ctr = document.getElementById(carousel.id + '-ctr');
    if (ctr) ctr.textContent = (idx + 1) + ' / ' + slides.length;
  }
}

// Click on an instruction link in the sidebar: navigate to category + slide
function _handleInstrClick(e) {
  var link = e.target.closest('a[data-instr]');
  if (!link) return;
  var instrId = link.getAttribute('data-instr');
  if (!instrId) return;

  // If we're already on the ISA page, prevent default and handle locally
  var href = link.getAttribute('href');
  var isHash = href && href.startsWith('#');
  if (isHash) {
    e.preventDefault();
    // Scroll to category
    var catEl = document.querySelector(href);
    if (catEl) {
      catEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // After scroll, move carousel
      setTimeout(function() { _moveCarouselToSlide(instrId); }, 100);
    }
  }
  // For cross-page links, the browser navigates normally;
  // on the target page, the hash will trigger the carousel
}

// Handle hash on page load (for cross-page navigation)
function _handleHash() {
  var hash = window.location.hash;
  if (!hash) return;
  // The hash points to a category like #aritmetica-e-logica
  // Find if any <a data-instr> on the page was the clicked link
  // We need to know WHICH instruction was targeted
  // For cross-page: we look for sessionStorage hint
  var instrId = sessionStorage.getItem('caldeira-instr-target');
  if (instrId) {
    sessionStorage.removeItem('caldeira-instr-target');
    setTimeout(function() { _moveCarouselToSlide(instrId); }, 300);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  _handleHash();
});

// Intercept all instruction link clicks to store target
window.addEventListener('click', function(e) {
  var link = e.target.closest('a[data-instr]');
  if (!link) return;
  var href = link.getAttribute('href');
  var isHash = href && href.startsWith('#');
  if (isHash) {
    _handleInstrClick(e);
  } else {
    // Cross-page: store target instruction for the next page
    sessionStorage.setItem('caldeira-instr-target', link.getAttribute('data-instr'));
  }
});

// ── Theme toggle (dark / light) ──
(function() {
  var root = document.documentElement;

  var saved = localStorage.getItem('caldeira-theme');
  if (saved === 'light') root.classList.add('light');

  function updateIcons() {
    var btns = document.querySelectorAll('.theme-toggle');
    var isLight = root.classList.contains('light');
	    btns.forEach(function(btn) { btn.innerHTML = isLight ? '<span class="material-icons" style="font-size:0.8rem">light_mode</span>' : '<span class="material-icons" style="font-size:0.8rem">dark_mode</span>'; });
  }
  updateIcons();

  window.toggleTheme = function() {
    root.classList.toggle('light');document.documentElement.dataset.theme=root.classList.contains('light')?'light':'dark';
    localStorage.setItem('caldeira-theme', root.classList.contains('light') ? 'light' : 'dark');
    updateIcons();
  };
})();
