var youtubeAPIReady = false;
var player;
var YT_API;

window.addEventListener('load', function() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      loadingElement.style.display = 'none';
    }, 100);
  }
});

function initializePlayerForId(playerId) {
  if (youtubeAPIReady && YT_API && document.getElementById(playerId)) {
    if (!player || (player.getIframe && player.getIframe().id !== playerId) ) {
      player = new YT_API.Player(playerId, {
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
      });
    }
  }
}

const lightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');

function openLightbox(imgElementSrc, imgElementAlt) {
  if (lightbox && lightboxImg && lightboxCaption) {
    lightbox.classList.add('active');
    lightboxImg.src = imgElementSrc;
    lightboxCaption.innerHTML = imgElementAlt || '';
    if (typeof fullpage_api !== 'undefined' && fullpage_api.setAllowScrolling) {
      fullpage_api.setAllowScrolling(false);
      fullpage_api.setKeyboardScrolling(false);
    }
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  if (lightbox) {
    lightbox.classList.remove('active');
    if (typeof fullpage_api !== 'undefined' && fullpage_api.setAllowScrolling) {
      fullpage_api.setAllowScrolling(true);
      fullpage_api.setKeyboardScrolling(true);
    }
    document.body.style.overflow = '';
  }
}

if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}

if (lightbox) {
  lightbox.addEventListener('click', function(event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

function setupImageClickListeners(sectionElement) {
  const imagesToLightbox = sectionElement.querySelectorAll('.portfolio-item img');
  imagesToLightbox.forEach(img => {
    const newImg = img.cloneNode(true);
    img.parentNode.replaceChild(newImg, img);
    newImg.style.cursor = 'pointer';
    newImg.addEventListener('click', function() {
      openLightbox(this.src, this.alt);
    });
  });
}

function setupGalleryImageClickListeners(sectionElement) {
  const imagesToLightbox = sectionElement.querySelectorAll('img');
  imagesToLightbox.forEach(img => {
    if (img.closest('.lightbox-ignore')) return;
    const newImg = img.cloneNode(true);
    img.parentNode.replaceChild(newImg, img);
    newImg.style.cursor = 'pointer';
    newImg.addEventListener('click', function() {
      openLightbox(this.src, this.alt);
    });
  });
}

function loadContent(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    return Promise.reject(new Error(`Target element with ID "${targetId}" not found.`));
  }
  target.style.opacity = '0';

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} while fetching ${url}`);
      }
      return response.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const mainContent = doc.querySelector('main');

      if (mainContent) {
        target.innerHTML = mainContent.innerHTML;
        const scripts = mainContent.querySelectorAll("script:not([src*='youtube.com/iframe_api']):not([src*='www.youtube.com/iframe_api'])");
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        if ((targetId === 'about-section' || targetId === 'hero-section-content') && target.querySelector('#youtube-player')) {
          initializePlayerForId('youtube-player');
        }
        if (targetId === 'portfolio-section') {
          setupImageClickListeners(target);
        }
        if (targetId === 'gallary-section') {
          setupGalleryImageClickListeners(target);
        }
        
        target.style.opacity = '1';
        if (typeof fullpage_api !== 'undefined' && fullpage_api.reBuild) {
          fullpage_api.reBuild();
        }
      } else {
        target.innerHTML = '<p>Lỗi tải nội dung (không tìm thấy thẻ main).</p>';
        target.style.opacity = '1';
      }
    })
    .catch(error => {
      console.error('Error loading content for ' + targetId + ':', error);
      target.innerHTML = `<p>Lỗi khi tải nội dung từ ${url}.</p>`;
      target.style.opacity = '1';
      throw error;
    });
}

document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger-icon');
  const navMenu = document.querySelector('.header nav ul');
  const navLinks = navMenu.querySelectorAll('a');

  if (hamburger && navMenu) {
      hamburger.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      const isActive = navMenu.classList.contains('active');
      hamburger.setAttribute('aria-expanded', isActive);
      const icon = hamburger.querySelector('i');
      if (icon) {
        icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
      }
    });
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                const icon = hamburger.querySelector('i');
                if (icon) { icon.className = 'fas fa-bars'; }
            }
        });
    });
  }

  new fullpage('#fullpage', {
    autoScrolling: true,
    scrollBar: false,
    scrollHorizontally: true,
    scrollOverflow: true,
    fitToSection: true,
    animateAnchor: true,
    scrollingSpeed: 700,
    licenseKey: 'YOUR_KEY_HERE',
    responsiveWidth: 768,

    afterRender: function(){
      
      Promise.all([
        
        loadContent('about.html', 'about-section'),
        loadContent('portfolio.html', 'portfolio-section'),
        loadContent('services.html', 'services-section'),
        loadContent('gallary.html', 'gallary-section'),
        
      ]).then(() => {
        if (typeof fullpage_api !== 'undefined' && fullpage_api.reBuild) {
          fullpage_api.reBuild();
        }
      }).catch(error => console.error('One or more sections failed to load:', error));
    },
    

    onLeave: function(origin, destination, direction) {
      const navLinksAll = document.querySelectorAll('.header nav ul a.nav-link');
      navLinksAll.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`.header nav ul a.nav-link[href="#${destination.anchor}"]`);
      if (activeLink) activeLink.classList.add('active');

      if (origin.anchor === 'about' && player && typeof player.pauseVideo === 'function') player.pauseVideo();

      const originSectionOrSlide = origin.item;
      if (originSectionOrSlide) {
        const leavingElements = originSectionOrSlide.querySelectorAll(
          '.animate-text, .animate-text-delay, .feature-card, .portfolio-item, .contact-info, .contact-form, .portfolio-content h2, .portfolio-content .portfolio-subtitle, .about-item, .service-item, .slide-content-wrapper h2, .slide-content-wrapper p, .slide-content-wrapper .hero-cta, .slide-image'
        );
        leavingElements.forEach(el => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
        });
      }
    },

    afterLoad: function(origin, destination, direction) {
      const currentSectionOrSlide = destination.item;
      let baseDelay = 50;

      const animateElements = (elements, stagger) => {
        elements.forEach((el, index) => {
          setTimeout(() => {
            el.style.opacity = 1;
            el.style.transform = 'translateY(0)';
          }, baseDelay + (index * stagger));
        });
        baseDelay += elements.length * stagger + 100;
      };
      
      const h1 = currentSectionOrSlide.querySelector('h1.animate-text');
      const pDelay = currentSectionOrSlide.querySelector('p.animate-text-delay');
      const cta = currentSectionOrSlide.querySelector('.hero-cta.animate-text-delay');
      const slideImage = currentSectionOrSlide.querySelector('.slide-image.animate-text-delay');

      if(h1) animateElements([h1], 0);
      if(pDelay) animateElements([pDelay], 0); 
      if(cta) animateElements([cta],0);
      if(slideImage) animateElements([slideImage], 0);


      if (destination.anchor === 'home') {
        const currentSlideElement = destination.item.querySelector('.fp-slide.active'); 
        if (currentSlideElement) {
            const slideH1 = currentSlideElement.querySelector('.hero-main-content h1.animate-text, .slide-content-wrapper h2.animate-text');
            const slideP = currentSlideElement.querySelector('.hero-main-content p.animate-text-delay, .slide-content-wrapper p.animate-text-delay');
            const slideCards = currentSlideElement.querySelectorAll('.hero-features-cards .feature-card');
            const slideCTA = currentSlideElement.querySelector('.slide-content-wrapper .hero-cta.animate-text-delay');
            const slideImg = currentSlideElement.querySelector('.slide-image.animate-text-delay');

            baseDelay = 50;
            if(slideH1) animateElements([slideH1],0);
            if(slideP) animateElements([slideP],0);
            if(slideCTA) animateElements([slideCTA],0);
            if(slideImg) animateElements([slideImg], 0);
            if(slideCards.length > 0) animateElements(slideCards, 100);
        }
      } else if (destination.anchor === 'portfolio') {
        const portfolioTitle = currentSectionOrSlide.querySelector('.portfolio-content h2');
        const portfolioSubtitle = currentSectionOrSlide.querySelector('.portfolio-content .portfolio-subtitle');
        const portfolioItems = currentSectionOrSlide.querySelectorAll('.portfolio-grid .portfolio-item');
        baseDelay = 50;
        if(portfolioTitle) animateElements([portfolioTitle],0);
        if(portfolioSubtitle) animateElements([portfolioSubtitle],0);
        if(portfolioItems.length > 0) animateElements(portfolioItems, 100);
      } else if (destination.anchor === 'about') {
        const aboutTitle = currentSectionOrSlide.querySelector('.about-content h2');
        const aboutItems = currentSectionOrSlide.querySelectorAll('.about-item');
        baseDelay = 50;
        if(aboutTitle) animateElements([aboutTitle],0);
        if(aboutItems.length > 0) animateElements(aboutItems,100);
      } else if (destination.anchor === 'services') {
        const servicesTitle = currentSectionOrSlide.querySelector('.services-content h2');
        const serviceItems = currentSectionOrSlide.querySelectorAll('.service-item');
        baseDelay = 50;
        if(servicesTitle) animateElements([servicesTitle],0);
        if(serviceItems.length > 0) animateElements(serviceItems,100);
      } else if (destination.anchor === 'contact') {
        const contactTitle = currentSectionOrSlide.querySelector('.contact-content h2');
        const contactSubtitle = currentSectionOrSlide.querySelector('.contact-content .contact-subtitle');
        const contactInfo = currentSectionOrSlide.querySelector('.contact-info');
        const contactForm = currentSectionOrSlide.querySelector('.contact-form');
        baseDelay = 50;
        if(contactTitle) animateElements([contactTitle],0);
        if(contactSubtitle) animateElements([contactSubtitle],0);
        if(contactInfo) animateElements([contactInfo],0);
        if(contactForm) animateElements([contactForm],0);
      }
    },
    controlArrows: true,
    controlArrowsHTML: [
      '<div class="fp-arrow"></div>',
      '<div class="fp-arrow"></div>'
    ],
    loopHorizontal: true
  });
});

function onYouTubeIframeAPIReady() {
  youtubeAPIReady = true;
  YT_API = YT;
  if (document.getElementById('youtube-player')) {
      initializePlayerForId('youtube-player');
  }
}
function onPlayerReady(event) { console.log("Player is ready"); }
function onPlayerStateChange(event) {
  if (player && YT_API && event.data === YT_API.PlayerState.PLAYING) {
    console.log('Video is playing.');
  }
}
function playVideo() { if (player && typeof player.playVideo === 'function') player.playVideo(); }
function pauseVideo() { if (player && typeof player.pauseVideo === 'function') player.pauseVideo(); }
function stopVideo() { if (player && typeof player.stopVideo === 'function') player.stopVideo(); }
function muteVideo() { if (player && typeof player.mute === 'function') player.mute(); }
function unMuteVideo() { if (player && typeof player.unMute === 'function') player.unMute(); }