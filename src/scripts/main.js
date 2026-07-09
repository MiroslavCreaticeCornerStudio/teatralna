// Teatralna Park Residence — site interactions.
// Ported verbatim from the Webflow custom-code embeds. Only the Webflow
// runtime (jQuery + webflow.js) was removed; GSAP and Swiper are bundled via npm.
import gsap from 'gsap';
import Swiper from 'swiper';
import { Navigation, Parallax } from 'swiper/modules';

// Deferred module scripts run after DOMContentLoaded may already have fired,
// so guard instead of relying on the event.
function ready(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}


function initDirectionalButtonHover() {
  document.querySelectorAll('[data-btn-hover]').forEach(button => {
    button.addEventListener('mouseenter', handleHover);
    button.addEventListener('mouseleave', handleHover);
  });
  function handleHover(event) {
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const buttonWidth = buttonRect.width;
    const buttonHeight = buttonRect.height;
    const buttonCenterX = buttonRect.left + buttonWidth / 2;
    const buttonCenterY = buttonRect.top + buttonHeight / 2;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const offsetXFromLeft = ((mouseX - buttonRect.left) / buttonWidth) * 100;
    const offsetYFromTop = ((mouseY - buttonRect.top) / buttonHeight) * 100;
    let offsetXFromCenter = ((mouseX - buttonCenterX) / (buttonWidth / 2)) * 50;
    offsetXFromCenter = Math.abs(offsetXFromCenter);
    const circle = button.querySelector('.btn__circle');
    if (circle) {
      circle.style.left = `${offsetXFromLeft.toFixed(1)}%`;
      circle.style.top = `${offsetYFromTop.toFixed(1)}%`;
      circle.style.width = `${115 + offsetXFromCenter * 2}%`;
    }
    const circleSecondary = button.querySelector('.btn__circle_secondary');
    if (circleSecondary) {
      circleSecondary.style.left = `${offsetXFromLeft.toFixed(1)}%`;
      circleSecondary.style.top = `${offsetYFromTop.toFixed(1)}%`;
      circleSecondary.style.width = `${115 + offsetXFromCenter * 2}%`;
    }
  }
}

function initMegaNavDirectionalHover() {
    const DUR = {
      bgMorph: 0.4,
      contentIn: 0.3,
      contentOut: 0.2,
      stagger: 0.25,
      backdropIn: 0.3,
      backdropOut: 0.2,
      openScale: 0.35,
      closeScale: 0.25,
    };
    const HOVER_ENTER = 120;
    const HOVER_LEAVE = 150;
    // DOM references
    const menuWrap = document.querySelector('[data-menu-wrap]');
    const navList = document.querySelector('[data-nav-list]');
    const dropWrapper = document.querySelector('[data-dropdown-wrapper]');
    const dropContainer = document.querySelector('[data-dropdown-container]');
    const dropBg = document.querySelector('[data-dropdown-bg]');
    const backdrop = document.querySelector('[data-menu-backdrop]');
    const toggles = [...document.querySelectorAll('[data-dropdown-toggle]')];
    const panels = [...document.querySelectorAll('[data-nav-content]')];
    const burger = document.querySelector('[data-burger-toggle]');
    const backBtn = document.querySelector('[data-mobile-back]');
    const logo = document.querySelector('[data-menu-logo]');
    const [lineTop, lineMid, lineBot] = ['top', 'mid', 'bot'].map((id) => document.querySelector(`[data-burger-line='${id}']`));
    // State
    const state = {
      isOpen: false,
      activePanel: null,
      activePanelIndex: -1,
      isMobile: window.innerWidth <= 991,
      mobileMenuOpen: false,
      mobilePanelActive: null,
      hoverTimer: null,
      leaveTimer: null,
      tl: null,
      mobileTl: null,
      mobilePanelTl: null,
    };
    // Helpers
    const getPanel = (name) => document.querySelector(`[data-nav-content="${name}"]`);
    const getToggle = (name) => document.querySelector(`[data-dropdown-toggle="${name}"]`);
    const getFade = (el) => el.querySelectorAll('[data-menu-fade]');
    const getNavItems = () => navList.querySelectorAll('[data-nav-list-item]');
    const getIndex = (name) => toggles.indexOf(getToggle(name));
    const stagger = (n) => (n <= 1 ? 0 : { amount: DUR.stagger });
    function clearTimers() {
      clearTimeout(state.hoverTimer);
      clearTimeout(state.leaveTimer);
      state.hoverTimer = state.leaveTimer = null;
    }
    function killTl(key) {
      if (state[key]) {
        state[key].kill();
        state[key] = null;
      }
    }
    function killDropdown() {
      killTl('tl');
      gsap.killTweensOf(dropContainer);
      gsap.killTweensOf(backdrop);
      panels.forEach((p) => {
        gsap.killTweensOf(p);
        gsap.killTweensOf(getFade(p));
      });
    }
    function killMobile() {
      killTl('mobileTl');
      gsap.killTweensOf([navList, lineTop, lineMid, lineBot]);
    }
    function killMobilePanel() {
      killTl('mobilePanelTl');
      gsap.killTweensOf(getNavItems());
      gsap.killTweensOf([backBtn, logo]);
      panels.forEach((p) => {
        gsap.killTweensOf(p);
        gsap.killTweensOf(getFade(p));
      });
    }
    function resetToggles() {
      toggles.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    }
    function resetDesktop() {
      panels.forEach((p) => {
        gsap.set(p, { visibility: 'hidden', opacity: 0, pointerEvents: 'none', xPercent: 0 });
        gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
      });
      gsap.set(dropContainer, { height: 0 });
      gsap.set(backdrop, { autoAlpha: 0 });
      menuWrap.setAttribute('data-menu-open', 'false');
      resetToggles();
    }
    function setupMobile() {
      panels.forEach((p) => {
        gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: 'visible', pointerEvents: 'none' });
        gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 });
      });
      gsap.set(getNavItems(), { xPercent: 0, y: 0, autoAlpha: 1 });
      gsap.set(navList, { autoAlpha: 0, x: 0 });
      gsap.set(backBtn, { autoAlpha: 0 });
      gsap.set(logo, { autoAlpha: 1 });
      gsap.set(dropContainer, { clearProps: 'height' });
      gsap.set(backdrop, { autoAlpha: 0 });
    }
    function measurePanel(name) {
      const el = getPanel(name);
      if (!el) return 0;
      const s = el.style;
      const prev = [s.visibility, s.opacity, s.pointerEvents];
      Object.assign(s, { visibility: 'visible', opacity: '0', pointerEvents: 'none' });
      const h = el.getBoundingClientRect().height;
      [s.visibility, s.opacity, s.pointerEvents] = prev;
      return h;
    }
    // DESKTOP — open dropdown (first open)
    function openDropdown(panelName) {
      if (state.isOpen && state.activePanel === panelName) return;
      if (state.isOpen) return switchPanel(state.activePanel, panelName);
      const height = measurePanel(panelName);
      if (!height) return;
      killDropdown();
      resetDesktop();
      const el = getPanel(panelName);
      const fade = getFade(el);
      const toggle = getToggle(panelName);
      state.isOpen = true;
      state.activePanel = panelName;
      state.activePanelIndex = getIndex(panelName);
      menuWrap.setAttribute('data-menu-open', 'true');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      gsap.set(dropContainer, { height: 0 });
      const tl = gsap.timeline();
      state.tl = tl;
      tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: 'power2.out' }, 0);
      tl.to(dropContainer, { height, duration: DUR.openScale, ease: 'power3.out' }, 0);
      tl.set(el, { visibility: 'visible', opacity: 1, pointerEvents: 'auto' }, 0.05);
      if (fade.length) {
        tl.fromTo(fade, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: DUR.contentIn, stagger: stagger(fade.length), ease: 'power3.out' }, 0.1);
      }
    }
    // DESKTOP — close dropdown
    function closeDropdown() {
      if (!state.isOpen) return;
      const el = getPanel(state.activePanel);
      const fade = el ? getFade(el) : [];
      killDropdown();
      const tl = gsap.timeline({
        onComplete() {
          state.isOpen = false;
          state.activePanel = null;
          state.activePanelIndex = -1;
          state.tl = null;
          resetDesktop();
        },
      });
      state.tl = tl;
      if (fade.length) tl.to(fade, { autoAlpha: 0, y: -4, duration: DUR.contentOut * 0.7, ease: 'power2.in' }, 0);
      tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: 'power2.in' }, 0.05);
      tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: 'power2.out' }, 0);
      if (el) tl.set(el, { visibility: 'hidden', opacity: 0, pointerEvents: 'none' });
    }
    // DESKTOP — switch panel (directional)
    function switchPanel(fromName, toName) {
      const dir = getIndex(toName) > getIndex(fromName) ? 1 : -1;
      const fromEl = getPanel(fromName),
        toEl = getPanel(toName);
      if (!fromEl || !toEl) return;
      const fromFade = getFade(fromEl),
        toFade = getFade(toEl);
      const toHeight = measurePanel(toName);
      if (!toHeight) return;
      killDropdown();
      // Reset all panels, then restore fromEl as visible
      panels.forEach((p) => {
        gsap.set(p, { visibility: 'hidden', opacity: 0, pointerEvents: 'none', xPercent: 0 });
        gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
      });
      gsap.set(fromEl, { visibility: 'visible', opacity: 1, pointerEvents: 'auto', x: 0 });
      if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
      gsap.set(backdrop, { autoAlpha: 1 });
      const toToggle = getToggle(toName);
      state.activePanel = toName;
      state.activePanelIndex = getIndex(toName);
      resetToggles();
      if (toToggle) toToggle.setAttribute('aria-expanded', 'true');
      const xOut = dir * -30,
        xIn = dir * 30;
      const tl = gsap.timeline();
      state.tl = tl;
      if (fromFade.length) tl.to(fromFade, { autoAlpha: 0, x: xOut, duration: DUR.contentOut, ease: 'power2.in' }, 0);
      tl.set(fromEl, { visibility: 'hidden', opacity: 0, pointerEvents: 'none', xPercent: 0 }, DUR.contentOut);
      if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut);
      tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: 'power3.out' }, 0.05);
      tl.set(toEl, { visibility: 'visible', opacity: 1, pointerEvents: 'auto', xPercent: 0 }, DUR.contentOut * 0.5);
      if (toFade.length) {
        tl.fromTo(toFade, { autoAlpha: 0, x: xIn }, { autoAlpha: 1, x: 0, duration: DUR.contentIn, stagger: stagger(toFade.length), ease: 'power3.out' }, DUR.contentOut * 0.6);
      }
    }
    // DESKTOP — hover intent
    function handleToggleEnter(e) {
      if (state.isMobile) return;
      const name = e.currentTarget.getAttribute('data-dropdown-toggle');
      if (!name) return;
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
      clearTimeout(state.hoverTimer);
      state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
    }
    function handleToggleLeave() {
      if (state.isMobile) return;
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
      state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
    }
    function handleWrapperEnter() {
      if (state.isMobile) return;
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
    }
    function handleWrapperLeave() {
      if (state.isMobile) return;
      state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
    }
    // DESKTOP — close behaviors
    function handleEscape(e) {
      if (e.key !== 'Escape') return;
      if (state.isMobile) {
        state.mobilePanelActive ? closeMobilePanel() : state.mobileMenuOpen && closeMobileMenu();
        return;
      }
      if (state.isOpen) {
        const t = getToggle(state.activePanel);
        closeDropdown();
        if (t) t.focus();
      }
    }
    function handleDocClick(e) {
      if (state.isMobile || !state.isOpen) return;
      if (!e.target.closest('[data-menu-wrap]')) closeDropdown();
    }
    // DESKTOP — keyboard navigation
    function focusFirstLink(panelName) {
      setTimeout(() => {
        const el = getPanel(panelName);
        if (!el) return;
        const link = el.querySelector('a');
        if (!link) return;
        gsap.set(link, { visibility: 'visible' });
        link.focus();
      }, 80);
    }
    function handleKeydownOnToggle(e) {
      if (state.isMobile) return;
      const name = e.currentTarget.getAttribute('data-dropdown-toggle');
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.isOpen && state.activePanel === name) closeDropdown();
        else {
          openDropdown(name);
          focusFirstLink(name);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!state.isOpen || state.activePanel !== name) openDropdown(name);
        focusFirstLink(name);
      }
      if (e.key === 'Tab' && !e.shiftKey && state.isOpen && state.activePanel === name) {
        e.preventDefault();
        const link = getPanel(name)?.querySelector('a');
        if (link) link.focus();
      }
    }
    function handleKeydownInPanel(e) {
      if (state.isMobile || !state.isOpen) return;
      const el = getPanel(state.activePanel);
      if (!el) return;
      const links = [...el.querySelectorAll('a')];
      const idx = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        links[(idx + 1) % links.length].focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx <= 0) {
          const t = getToggle(state.activePanel);
          if (t) t.focus();
        } else links[idx - 1].focus();
      }
      if (e.key === 'Tab' && !e.shiftKey && idx === links.length - 1) {
        e.preventDefault();
        const curIdx = toggles.indexOf(getToggle(state.activePanel));
        const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
        closeDropdown();
        if (next) next.focus();
      }
      if (e.key === 'Tab' && e.shiftKey && idx === 0) {
        e.preventDefault();
        const t = getToggle(state.activePanel);
        if (t) t.focus();
      }
    }
    // MOBILE — burger animation
    function animateBurger(toX) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      if (toX) {
        tl.to(lineTop, { y: '0.3125em', duration: 0.15 }, 0);
        tl.to(lineBot, { y: '-0.3125em', duration: 0.15 }, 0);
        tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
        tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
        tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
      } else {
        tl.to(lineTop, { rotation: 0, duration: 0.2 }, 0);
        tl.to(lineBot, { rotation: 0, duration: 0.2 }, 0);
        tl.to(lineTop, { y: 0, duration: 0.15 }, 0.15);
        tl.to(lineBot, { y: 0, duration: 0.15 }, 0.15);
        tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
      }
      return tl;
    }
    // MOBILE — open/close menu
    function openMobileMenu() {
      killMobile();
      state.mobileMenuOpen = true;
      menuWrap.setAttribute('data-menu-open', 'true');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const items = getNavItems();
      const tl = gsap.timeline();
      state.mobileTl = tl;
      tl.add(animateBurger(true), 0);
      tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0);
      if (items.length) {
        tl.fromTo(items, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power3.out' }, 0.15);
      }
    }
    function closeMobileMenu() {
      const hadPanel = state.mobilePanelActive;
      const panelEl = hadPanel ? getPanel(hadPanel) : null;
      killMobile();
      killMobilePanel();
      menuWrap.setAttribute('data-menu-open', 'false');
      state.mobileMenuOpen = false;
      state.mobilePanelActive = null;
      burger.setAttribute('aria-expanded', 'false');
      const tl = gsap.timeline({
        onComplete() {
          document.body.style.overflow = '';
          state.mobileTl = null;
          setupMobile();
        },
      });
      state.mobileTl = tl;
      tl.add(animateBurger(false), 0);
      // If a panel was open, fade it out with the close — no snap reset
      if (hadPanel && panelEl) {
        tl.to(panelEl, { autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05);
        tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0.05);
      }
      // Fade out the nav list container
      tl.to(navList, { autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05);
    }
    // MOBILE — slide-over panels
    function openMobilePanel(panelName) {
      const el = getPanel(panelName);
      if (!el) return;
      killMobilePanel();
      state.mobilePanelActive = panelName;
      const navItems = getNavItems();
      const panelFade = getFade(el);
      const tl = gsap.timeline();
      state.mobilePanelTl = tl;
      // Fade out each nav item to the left
      if (navItems.length) {
        tl.to(
          navItems,
          {
            xPercent: -10,
            autoAlpha: 0,
            duration: 0.35,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0,
        );
      }
      // Logo → back button swap
      tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
      tl.to(backBtn, { autoAlpha: 1, duration: 0.25, ease: 'power2.inOut' }, 0.15);
      // Show panel container, then fade in its items from the right
      tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: 'auto' }, 0.2);
      if (panelFade.length) {
        tl.fromTo(panelFade, { xPercent: 8, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.3, stagger: stagger(panelFade.length), ease: 'power3.out' }, 0.25);
      }
    }
    function closeMobilePanel() {
      if (!state.mobilePanelActive) return;
      const el = getPanel(state.mobilePanelActive);
      if (!el) return;
      killMobilePanel();
      const navItems = getNavItems();
      const panelFade = getFade(el);
      const tl = gsap.timeline({
        onComplete() {
          state.mobilePanelActive = null;
          state.mobilePanelTl = null;
        },
      });
      state.mobilePanelTl = tl;
      // Fade out panel items to the right
      if (panelFade.length) {
        tl.to(
          el,
          {
            xPercent: 20,
            autoAlpha: 0,
            duration: 0.3,
            stagger: 0.02,
            ease: 'power2.in',
          },
          0,
        );
      }
      // Hide panel
      tl.set(el, { autoAlpha: 0, pointerEvents: 'none' }, 0.25);
      // Back → logo swap
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
      tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 0.15);
      // Fade nav items back in from center
      if (navItems.length) {
        tl.fromTo(navItems, { xPercent: -20, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: 'power3.out' }, 0.25);
      }
    }
    function handleToggleClick(e) {
      if (!state.isMobile || !state.mobileMenuOpen) return;
      const name = e.currentTarget.getAttribute('data-dropdown-toggle');
      if (name) {
        e.preventDefault();
        openMobilePanel(name);
      }
    }
    // RESIZE
    let resizeTimer = null;
    let lastWidth = window.innerWidth;
    function handleResize() {
      const w = window.innerWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const was = state.isMobile;
        state.isMobile = window.innerWidth <= 991;
        if (was && !state.isMobile) {
          killMobile();
          killMobilePanel();
          gsap.set(navList, { clearProps: 'all' });
          gsap.set(getNavItems(), { clearProps: 'all' });
          gsap.set(backBtn, { autoAlpha: 0 });
          gsap.set(logo, { clearProps: 'all' });
          gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 });
          panels.forEach((p) => {
            gsap.set(p, { clearProps: 'all' });
            gsap.set(getFade(p), { clearProps: 'all' });
          });
          burger.setAttribute('aria-expanded', 'false');
          state.mobileMenuOpen = false;
          state.mobilePanelActive = null;
          document.body.style.overflow = '';
          resetDesktop();
        }
        if (!was && state.isMobile) {
          killDropdown();
          state.isOpen = false;
          state.activePanel = null;
          state.activePanelIndex = -1;
          clearTimers();
          menuWrap.setAttribute('data-menu-open', 'false');
          resetToggles();
          setupMobile();
        }
      }, 150);
    }
    // EVENT BINDING
    toggles.forEach((btn) => {
      btn.addEventListener('mouseenter', handleToggleEnter);
      btn.addEventListener('mouseleave', handleToggleLeave);
      btn.addEventListener('keydown', handleKeydownOnToggle);
      btn.addEventListener('click', handleToggleClick);
    });
    dropWrapper.addEventListener('mouseenter', handleWrapperEnter);
    dropWrapper.addEventListener('mouseleave', handleWrapperLeave);
    panels.forEach((p) => p.addEventListener('keydown', handleKeydownInPanel));
    backdrop.addEventListener('click', closeDropdown);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleDocClick);
    burger.addEventListener('click', () => (state.mobileMenuOpen ? closeMobileMenu() : openMobileMenu()));
    backBtn.addEventListener('click', closeMobilePanel);
    window.addEventListener('resize', handleResize);
    // INIT
    state.isMobile ? setupMobile() : resetDesktop();
  }

// Reads a browser cookie by name (used for Meta's _fbc / _fbp).
function readCookie(name) {
  const m = document.cookie.match(
    '(?:^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)'
  );
  return m ? decodeURIComponent(m[1]) : null;
}

// Capture ad-attribution params (UTM + Google gclid + Facebook fbclid) and
// persist them in localStorage so they survive across pages, then populate the
// hidden form fields. fbclid + fbc/fbp power Facebook Offline Conversion Tracking.
function initUtmCapture() {
  const STORE_KEY = 'tpr_attribution';
  // URL query param -> data-utm-field key on the hidden inputs
  const PARAM_MAP = {
    utm_source: 'source',
    utm_medium: 'medium',
    utm_campaign: 'campaign_name',
    utm_campaign_id: 'campaign_id',
    utm_term: 'utm_term',
    utm_content: 'utm_content',
    gclid: 'gclid',
    gad_source: 'gad_source',
    gad_campaignid: 'gad_campaignid',
    fbclid: 'fbclid',
  };
  const parseJSON = (s) => {
    try { return JSON.parse(s) || {}; } catch { return {}; }
  };
  const params = new URLSearchParams(window.location.search);
  const stored = parseJSON(localStorage.getItem(STORE_KEY));

  // Last-touch: newest campaign params override stored ones.
  const data = { ...stored };
  Object.entries(PARAM_MAP).forEach(([param, key]) => {
    const v = params.get(param);
    if (v) data[key] = v;
  });

  // First-touch metadata: only set once.
  if (!data.landing_page) data.landing_page = window.location.href;
  if (!data.captured_at) data.captured_at = new Date().toISOString();

  // Facebook: prefer the Pixel's _fbc cookie; otherwise build the fbc value
  // from fbclid in Meta's required format (fb.1.<timestamp>.<fbclid>).
  const fbcCookie = readCookie('_fbc');
  if (fbcCookie) data.fbc = fbcCookie;
  else if (data.fbclid && !data.fbc) data.fbc = `fb.1.${Date.now()}.${data.fbclid}`;
  const fbp = readCookie('_fbp');
  if (fbp) data.fbp = fbp;

  localStorage.setItem(STORE_KEY, JSON.stringify(data));

  Object.entries(data).forEach(([key, value]) => {
    document.querySelectorAll(`[data-utm-field="${key}"]`).forEach((field) => {
      field.value = value;
    });
  });
}

function initSwiper() {
  if (!document.querySelector('.swiper')) return;
  new Swiper('.swiper', {
    modules: [Navigation, Parallax],
    speed: 400,
    parallax: true,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
}

function initAdvancedFormValidation() {
        const forms = document.querySelectorAll('[data-form-validate]');
        forms.forEach((formContainer) => {
            // Configuration constants
            const SPAM_PREVENTION_TIMEOUT = 5000;
            const VALIDATION_PATTERNS = {
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                phone: /^(\+?\d{7,15})$/
            };
            const INVALID_SELECT_VALUES = ['', 'disabled', 'null', 'false'];
            const startTime = new Date().getTime();
            const form = formContainer.querySelector('form');
            if (!form) return;
            const validateFields = form.querySelectorAll('[data-validate]');
            const dataSubmit = form.querySelector('[data-submit]');
            if (!dataSubmit) return;
            const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
            if (!realSubmitInput) return;
            // DOM Cache using WeakMap for automatic memory management
            const fieldDataMap = new WeakMap();
            function isSpam() {
                const currentTime = new Date().getTime();
                return currentTime - startTime < SPAM_PREVENTION_TIMEOUT;
            }
            // Cache field data to avoid repeated DOM queries
            function getFieldData(fieldGroup) {
                if (!fieldDataMap.has(fieldGroup)) {
                    const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
                    const data = {
                        radioCheckGroup,
                        input: radioCheckGroup ? null : fieldGroup.querySelector('input, textarea, select'),
                        radioCheckboxInputs: radioCheckGroup ? radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]') : null,
                        min: null,
                        max: null,
                        type: null
                    };
                    // Cache validation parameters
                    if (data.radioCheckGroup) {
                        const minAttr = data.radioCheckGroup.getAttribute('min');
                        data.min = minAttr !== null ? parseInt(minAttr) : 1;
                        data.max = parseInt(data.radioCheckGroup.getAttribute('max')) || data.radioCheckboxInputs.length;
                        data.type = data.radioCheckboxInputs[0]?.type;
                    } else if (data.input) {
                        data.min = parseInt(data.input.getAttribute('min')) || 0;
                        data.max = parseInt(data.input.getAttribute('max')) || Infinity;
                        data.type = data.input.type;
                    }
                    fieldDataMap.set(fieldGroup, data);
                }
                return fieldDataMap.get(fieldGroup);
            }
            // Specific validators for different input types
            const validators = {
                email: (value) => VALIDATION_PATTERNS.email.test(value),
                tel: (value) => {
                    const cleanPhone = value.replace(/[^\d+]/g, '');
                    return VALIDATION_PATTERNS.phone.test(cleanPhone) && cleanPhone.length >= 7;
                },
                select: (value) => !INVALID_SELECT_VALUES.includes(value),
                text: (value, min, max) => {
                    const length = value.length;
                    if (min && length < min) return false;
                    if (max !== Infinity && length > max) return false;
                    return true;
                },
                radioCheckbox: (checkedCount, min, max, isRadio, isSingle) => {
                    if (isRadio) return checkedCount >= min;
                    if (isSingle) return checkedCount === 1;
                    return checkedCount >= min && checkedCount <= max;
                }
            };
            // Disable select options with invalid values on page load
            validateFields.forEach(function (fieldGroup) {
                const select = fieldGroup.querySelector('select');
                if (select) {
                    const options = select.querySelectorAll('option');
                    options.forEach(function (option) {
                        if (INVALID_SELECT_VALUES.includes(option.value)) {
                            option.setAttribute('disabled', 'disabled');
                        }
                    });
                }
            });
            function validateAndStartLiveValidationForAll() {
                let allValid = true;
                let firstInvalidField = null;
                validateFields.forEach(function (fieldGroup) {
                    const fieldData = getFieldData(fieldGroup);
                    const input = fieldData.input;
                    const radioCheckGroup = fieldData.radioCheckGroup;
                    if (!input && !radioCheckGroup) return;
                    if (input) input.__validationStarted = true;
                    if (radioCheckGroup) {
                        radioCheckGroup.__validationStarted = true;
                        fieldData.radioCheckboxInputs.forEach(function (input) {
                            input.__validationStarted = true;
                        });
                    }
                    updateFieldStatus(fieldGroup);
                    if (!isValid(fieldGroup)) {
                        allValid = false;
                        if (!firstInvalidField) {
                            firstInvalidField = input || radioCheckGroup.querySelector('input');
                        }
                    }
                });
                if (!allValid && firstInvalidField) {
                    firstInvalidField.focus();
                }
                return allValid;
            }
            // Refactored validation function using cached data and specific validators
            function isValid(fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                if (fieldData.radioCheckGroup) {
                    const checkedCount = fieldData.radioCheckGroup.querySelectorAll('input:checked').length;
                    const isRadio = fieldData.type === 'radio';
                    const isSingle = fieldData.radioCheckboxInputs.length === 1;
                    return validators.radioCheckbox(
                        checkedCount,
                        fieldData.min,
                        fieldData.max,
                        isRadio,
                        isSingle
                    );
                }
                const input = fieldData.input;
                if (!input) return false;
                const value = input.value.trim();
                const inputType = input.tagName.toLowerCase() === 'select' ? 'select' : input.type;
                // Use specific validator or fall back to text validator
                const validator = validators[inputType] || validators.text;
                return inputType === 'select' || inputType === 'email' || inputType === 'tel'
                    ? validator(value)
                    : validator(value, fieldData.min, fieldData.max);
            }
            // Helper function to update validation state classes
            function setValidationState(fieldGroup, isValid, hasStarted) {
                if (isValid) {
                    fieldGroup.classList.add('is--success');
                    fieldGroup.classList.remove('is--error');
                } else {
                    fieldGroup.classList.remove('is--success');
                    if (hasStarted) {
                        fieldGroup.classList.add('is--error');
                    } else {
                        fieldGroup.classList.remove('is--error');
                    }
                }
            }
            function updateFieldStatus(fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                if (fieldData.radioCheckGroup) {
                    const checkedInputs = fieldData.radioCheckGroup.querySelectorAll('input:checked');
                    // Update filled state
                    fieldGroup.classList.toggle('is--filled', checkedInputs.length > 0);
                    // Update validation state
                    const valid = isValid(fieldGroup);
                    const anyInputValidationStarted = Array.from(fieldData.radioCheckboxInputs).some(
                        input => input.__validationStarted
                    );
                    setValidationState(fieldGroup, valid, anyInputValidationStarted);
                } else {
                    const input = fieldData.input;
                    if (!input) return;
                    const value = input.value.trim();
                    // Update filled state
                    fieldGroup.classList.toggle('is--filled', !!value);
                    // Update validation state
                    const valid = isValid(fieldGroup);
                    setValidationState(fieldGroup, valid, input.__validationStarted);
                }
            }
            // Phone input character filtering constants
            const CONTROL_KEYS = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
                                  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
            const PHONE_ALLOWED_CHARS = /[0-9+\-() ]/;
            const PHONE_CLEANUP_PATTERN = /[^0-9+\-() ]/g;
            validateFields.forEach(function (fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                const input = fieldData.input;
                const radioCheckGroup = fieldData.radioCheckGroup;
                if (radioCheckGroup) {
                    fieldData.radioCheckboxInputs.forEach(function (input) {
                        input.__validationStarted = false;
                        input.addEventListener('change', function () {
                            requestAnimationFrame(function () {
                                if (!input.__validationStarted) {
                                    const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
                                    // Start validation when min requirement is met, or immediately if min=0 (optional)
                                    if (checkedCount >= fieldData.min || fieldData.min === 0) {
                                        input.__validationStarted = true;
                                    }
                                }
                                if (input.__validationStarted) {
                                    updateFieldStatus(fieldGroup);
                                }
                            });
                        });
                        input.addEventListener('blur', function () {
                            input.__validationStarted = true;
                            updateFieldStatus(fieldGroup);
                        });
                    });
                } else if (input) {
                    input.__validationStarted = false;
                    // Phone input specific handling
                    if (input.type === 'tel') {
                        // Prevent typing invalid characters
                        input.addEventListener('keydown', function (e) {
                            // Allow control keys
                            if (CONTROL_KEYS.includes(e.key)) {
                                return;
                            }
                            // Allow Ctrl/Cmd shortcuts
                            if ((e.ctrlKey || e.metaKey) && /^[acvxACVX]$/.test(e.key)) {
                                return;
                            }
                            // Allow only valid phone characters
                            if (!PHONE_ALLOWED_CHARS.test(e.key)) {
                                e.preventDefault();
                            }
                        });
                        // Clean pasted content
                        input.addEventListener('input', function (e) {
                            const cursorPos = input.selectionStart;
                            const oldValue = input.value;
                            const newValue = oldValue.replace(PHONE_CLEANUP_PATTERN, '');
                            if (oldValue !== newValue) {
                                input.value = newValue;
                                input.setSelectionRange(cursorPos - 1, cursorPos - 1);
                            }
                        });
                    }
                    // Validation event listeners
                    if (input.tagName.toLowerCase() === 'select') {
                        input.addEventListener('change', function () {
                            input.__validationStarted = true;
                            updateFieldStatus(fieldGroup);
                        });
                    } else {
                        input.addEventListener('input', function () {
                            const value = input.value.trim();
                            const length = value.length;
                            if (!input.__validationStarted) {
                                // Start validation based on input type
                                if (input.type === 'email' || input.type === 'tel') {
                                    if (isValid(fieldGroup)) {
                                        input.__validationStarted = true;
                                    }
                                } else {
                                    if ((input.hasAttribute('min') && length >= fieldData.min) ||
                                        (input.hasAttribute('max') && length <= fieldData.max)) {
                                        input.__validationStarted = true;
                                    }
                                }
                            }
                            if (input.__validationStarted) {
                                updateFieldStatus(fieldGroup);
                            }
                        }, { capture: false });
                        input.addEventListener('blur', function () {
                            input.__validationStarted = true;
                            updateFieldStatus(fieldGroup);
                        });
                    }
                }
            });
            dataSubmit.addEventListener('click', function () {
                if (validateAndStartLiveValidationForAll()) {
                    if (isSpam()) {
                        alert('Form submitted too quickly. Please try again.');
                        return;
                    }
                    realSubmitInput.click();
                }
            });
            form.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                    event.preventDefault();
                    if (validateAndStartLiveValidationForAll()) {
                        if (isSpam()) {
                            alert('Form submitted too quickly. Please try again.');
                            return;
                        }
                        realSubmitInput.click();
                    }
                }
            });
        });
    }

// Lead submission -> Skyguru CRM.
// NOTE: the payload uses the form field `name` attributes verbatim
// (First-Name, Last-Name, email, Phone, Terms-Conditions + utm_* hidden fields).
// >>> Confirm these key names match what https://skyguru.ai expects. <<<
const CRM_ENDPOINT = 'https://skyguru.ai/api/v1/public/leads';
function initCrmSubmit() {
  const form = document.querySelector('#wf-form-Contact-Form');
  if (!form) return;
  const block = form.closest('.w-form') || form.parentElement;
  const done = block ? block.querySelector('.w-form-done') : null;
  const fail = block ? block.querySelector('.w-form-fail') : null;
  const submitBtn = form.querySelector('input[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    // Refresh Meta cookies — the Pixel may set _fbc/_fbp after initial load.
    const fbc = readCookie('_fbc');
    const fbp = readCookie('_fbp');
    if (fbc) payload.fbc = fbc;
    if (fbp) payload.fbp = fbp;
    const origVal = submitBtn ? submitBtn.value : null;
    if (submitBtn) submitBtn.value = submitBtn.getAttribute('data-wait') || submitBtn.value;
    try {
      const res = await fetch(CRM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Lead endpoint returned ' + res.status);
      form.style.display = 'none';
      if (done) done.style.display = 'block';
      if (fail) fail.style.display = 'none';
      form.reset();
    } catch (err) {
      console.error('Lead submission failed:', err);
      if (fail) fail.style.display = 'block';
    } finally {
      if (submitBtn && origVal !== null) submitBtn.value = origVal;
    }
  });
}

function initFixedButtons() {

  const buttons = document.querySelector('.fixed_buttons-wrapper');
  if (!buttons) return;
  // Sections that HIDE the buttons while in view.
  // rootMargin is the tuning knob — see note below.
const hideSections = [
  { selector: '#hero',       rootMargin: '-65% 0px 0px 0px' },
  { selector: '#contact-us', rootMargin: '0px 0px -40% 0px' },
  { selector: '#footer',     rootMargin: '0px' },
];
  const active = new Set();
  const update = () => buttons.classList.toggle('is-hidden', active.size > 0);
  hideSections.forEach(({ selector, rootMargin }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.isIntersecting ? active.add(selector) : active.delete(selector);
      });
      update();
    }, { root: null, rootMargin, threshold: 0 }).observe(el);
  });

}

function initYear() {
  const y = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = y; });
}

function initNavScroll() {
  const menu = document.querySelector('[data-menu-wrap]');
  if (!menu) return;
  const SCROLL_THRESHOLD = 88;
  const handleScroll = () => menu.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  handleScroll();
  window.addEventListener('scroll', handleScroll);
}

ready(() => {
  initDirectionalButtonHover();
  initMegaNavDirectionalHover();
  initUtmCapture();
  initSwiper();
  initAdvancedFormValidation();
  initCrmSubmit();
  initFixedButtons();
  initYear();
  initNavScroll();
});
