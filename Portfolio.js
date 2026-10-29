(() => {
  'use strict';

  const shots = Array.from(document.querySelectorAll('.shot'));
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const closeBtn = box.querySelector('.lb-close');
  const prevBtn = box.querySelector('.prev');
  const nextBtn = box.querySelector('.next');
  let current = 0;
  let opener = null;

  const show = (i) => {
    current = (i + shots.length) % shots.length;
    const src = shots[current].querySelector('img');
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
  };

  const open = (i) => {
    opener = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    box.hidden = true;
    document.body.style.overflow = '';
    if (opener) opener.focus();
  };

  shots.forEach((btn, i) => btn.addEventListener('click', () => open(i)));
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });

  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {
      const items = [closeBtn, prevBtn, nextBtn];
      const idx = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(idx + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });

  const pages = Array.from(document.querySelectorAll('.hero, .work, .about, .contact'));
  const progressBar = document.querySelector('.scroll-progress');
  const progressFill = progressBar.querySelector('span');
  const initialPage = pages.findIndex((page) => page.id === window.location.hash.slice(1));
  let activeIndex = initialPage >= 0 ? initialPage : 0;
  let transitioning = false;
  let wheelGestureLocked = false;
  let wheelGestureTimer;

  const updateProgress = () => {
    const page = pages[activeIndex];
    const scrollableDistance = page.scrollHeight - page.clientHeight;
    const pageProgress = scrollableDistance > 0
      ? Math.min(1, Math.max(0, page.scrollTop / scrollableDistance))
      : 0;
    const progress = activeIndex === pages.length - 1
      ? 1
      : (activeIndex + pageProgress) / pages.length;
    const percentage = Math.round(progress * 100);

    progressFill.style.transform = `scaleX(${progress})`;
    progressBar.setAttribute('aria-valuenow', String(percentage));
  };

  pages.forEach((page, index) => {
    const active = index === activeIndex;
    page.classList.toggle('is-active', active);
    page.inert = !active;
    page.setAttribute('aria-hidden', String(!active));
    page.style.zIndex = active ? '1' : '0';
    page.addEventListener('scroll', updateProgress, { passive: true });
  });
  window.addEventListener('resize', updateProgress);
  document.documentElement.classList.add('panel-mode');
  document.documentElement.classList.toggle('about-active', pages[activeIndex].classList.contains('about'));
  updateProgress();

  const canScroll = (page, direction) => {
    if (direction > 0) return page.scrollTop + page.clientHeight < page.scrollHeight - 2;
    return page.scrollTop > 2;
  };

  const changePage = (nextIndex) => {
    if (transitioning || nextIndex < 0 || nextIndex >= pages.length || nextIndex === activeIndex) return;

    const previous = pages[activeIndex];
    const next = pages[nextIndex];
    transitioning = true;
    previous.classList.remove('is-active');
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');
    previous.style.zIndex = '1';
    next.scrollTop = 0;
    next.style.zIndex = '2';
    next.inert = false;
    next.setAttribute('aria-hidden', 'false');
    next.classList.add('is-active');
    activeIndex = nextIndex;
    updateProgress();
    document.documentElement.classList.toggle('about-active', next.classList.contains('about'));

    window.setTimeout(() => {
      previous.style.zIndex = '0';
      transitioning = false;
    }, 800);
  };

  document.addEventListener('wheel', (event) => {
    if (!box.hidden) {
      event.preventDefault();
      return;
    }

    const direction = Math.sign(event.deltaY);
    if (!direction) return;
    const page = pages[activeIndex];
    if (canScroll(page, direction)) return;

    event.preventDefault();
    if (wheelGestureLocked || transitioning) {
      window.clearTimeout(wheelGestureTimer);
      wheelGestureTimer = window.setTimeout(() => { wheelGestureLocked = false; }, 250);
      return;
    }

    wheelGestureLocked = true;
    changePage(activeIndex + direction);
    wheelGestureTimer = window.setTimeout(() => { wheelGestureLocked = false; }, 900);
  }, { passive: false });

  document.addEventListener('keydown', (event) => {
    if (!box.hidden || event.altKey || event.ctrlKey || event.metaKey) return;

    const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1
      : event.key === 'ArrowUp' || event.key === 'PageUp' ? -1
        : 0;
    if (!direction) return;

    const page = pages[activeIndex];
    if (canScroll(page, direction)) return;

    event.preventDefault();
    changePage(activeIndex + direction);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href').slice(1);
      const nextIndex = targetId === 'main' ? 0 : pages.findIndex((page) => page.id === targetId);
      if (nextIndex < 0) return;

      event.preventDefault();
      changePage(nextIndex);
    });
  });

  let touchStartY = null;
  pages.forEach((page) => {
    page.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) touchStartY = event.touches[0].clientY;
    }, { passive: true });

    page.addEventListener('touchend', (event) => {
      if (touchStartY === null || !box.hidden) return;

      const distance = touchStartY - event.changedTouches[0].clientY;
      touchStartY = null;
      if (Math.abs(distance) < 50) return;

      if (distance > 0 && !canScroll(page, 1)) changePage(activeIndex + 1);
      else if (distance < 0 && !canScroll(page, -1)) changePage(activeIndex - 1);
    }, { passive: true });
  });
})();