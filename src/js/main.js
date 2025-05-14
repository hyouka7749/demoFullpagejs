var youtubeAPIReady = false;
var player;
var YT_API;

window.addEventListener('load', function() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      loadingElement.style.display = 'none';
    }, 500);
  }
});

function initializePlayerForId(playerId) {
  if (youtubeAPIReady && YT_API && document.getElementById(playerId)) {
    if (!player || (player.getIframe && player.getIframe().id !== playerId) ) {
      console.log('Initializing YouTube player for ID: ' + playerId + ' from main.js');
      player = new YT_API.Player(playerId, {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    } else if (player && player.getIframe && player.getIframe().id === playerId) {
      console.log('Player already initialized for ' + playerId);
    }
  } else {
    if (!youtubeAPIReady) console.log("YouTube API not ready for " + playerId + ". Waiting...");
    if (!document.getElementById(playerId)) console.log("Player iframe not found in DOM for " + playerId);
  }
}

function loadContent(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    console.error(`Error: Target element with ID "${targetId}" not found.`);
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
          console.log(targetId + ' content loaded, attempting to initialize player.');
          initializePlayerForId('youtube-player');
        }

        setTimeout(() => {
          target.style.opacity = '1';
          if (typeof fullpage_api !== 'undefined' && fullpage_api.reBuild) {
            fullpage_api.reBuild();
          }
        }, 50);
      } else {
        console.error(`Error: Could not find <main> element in fetched content from ${url}`);
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
        if (isActive) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });
  }

  new fullpage('#fullpage', {
    autoScrolling: true,
    scrollBar: false,
    scrollHorizontally: true,
    navigation: true,
    anchors: ['home', 'about', 'portfolio', 'services', 'contact'],
    // navigationTooltips: ['Trang chủ', 'Giới thiệu', 'Dự án', 'Dịch vụ', 'Liên hệ'],
    showActiveTooltip: true,
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
        
      ]).then(() => {
        console.log('All dynamic sections loaded.');
        if (typeof fullpage_api !== 'undefined' && fullpage_api.reBuild) {
          fullpage_api.reBuild();
        }
      }).catch(error => {
        console.error('One or more sections failed to load:', error);
      });

      if (document.body.classList.contains('fp-responsive')) {
        console.log("FullPage is in responsive mode");
      }
    },

    onLeave: function(origin, destination, direction) {
      const navLinksAll = document.querySelectorAll('.header nav ul a.nav-link');
      navLinksAll.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`.header nav ul a.nav-link[href="#${destination.anchor}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }

      if (origin.anchor === 'about' && player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }

      const originSection = origin.item;
      if (originSection) {
        const leavingElements = originSection.querySelectorAll(
          '.animate-text, .animate-text-delay, .feature-card, .portfolio-item, .contact-info, .contact-form, .portfolio-content h2, .portfolio-content .portfolio-subtitle, .about-item, .service-item'
        );
        leavingElements.forEach(el => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
        });
      }
    },

    afterLoad: function(origin, destination, direction) {
      const currentSection = destination.item;

      if (destination.anchor === 'home') {
        const animatedH1 = currentSection.querySelector('.hero-main-content h1.animate-text');
        const animatedP = currentSection.querySelector('.hero-main-content p.animate-text-delay');
        const animatedCards = currentSection.querySelectorAll('.hero-features-cards .feature-card');
        const heroCTA = currentSection.querySelector('.hero-main-content .hero-cta');

        if (animatedH1) { setTimeout(() => { animatedH1.style.opacity = 1; animatedH1.style.transform = 'translateY(0)'; }, 50); }
        if (animatedP) { setTimeout(() => { animatedP.style.opacity = 1; animatedP.style.transform = 'translateY(0)'; }, 200); }
        if (heroCTA) { setTimeout(() => { heroCTA.style.opacity = 1; heroCTA.style.transform = 'translateY(0)'; }, 350); }
        animatedCards.forEach((card, index) => {
          setTimeout(() => {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
          }, 200 + (index * 100));
        });
      }

      if (destination.anchor === 'portfolio') {
        const portfolioTitle = currentSection.querySelector('.portfolio-content h2');
        const portfolioSubtitle = currentSection.querySelector('.portfolio-content .portfolio-subtitle');
        const portfolioItems = currentSection.querySelectorAll('.portfolio-grid .portfolio-item');

        if (portfolioTitle) { setTimeout(() => { portfolioTitle.style.opacity = 1; portfolioTitle.style.transform = 'translateY(0)'; }, 100); }
        if (portfolioSubtitle) { setTimeout(() => { portfolioSubtitle.style.opacity = 1; portfolioSubtitle.style.transform = 'translateY(0)'; }, 200); }
        portfolioItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = 1;
            item.style.transform = 'translateY(0)';
          }, 300 + (index * 150));
        });
      }

      if (destination.anchor === 'about') {
        const aboutItems = currentSection.querySelectorAll('.about-item'); 
        const aboutTitle = currentSection.querySelector('.about-content h2'); 
         if (aboutTitle) { setTimeout(() => { aboutTitle.style.opacity = 1; aboutTitle.style.transform = 'translateY(0)'; }, 100); }
        aboutItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = 1;
            item.style.transform = 'translateY(0)';
          }, 200 + (index * 100));
        });
      }
      
      if (destination.anchor === 'services') {
        const serviceItems = currentSection.querySelectorAll('.service-item'); 
        const servicesTitle = currentSection.querySelector('.services-content h2'); 
        if (servicesTitle) { setTimeout(() => { servicesTitle.style.opacity = 1; servicesTitle.style.transform = 'translateY(0)'; }, 100); }
        serviceItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = 1;
            item.style.transform = 'translateY(0)';
          }, 200 + (index * 100));
        });
      }

      if (destination.anchor === 'contact') {
        const contactTitle = currentSection.querySelector('.contact-content h2');
        const contactSubtitle = currentSection.querySelector('.contact-content .contact-subtitle');
        const contactInfo = currentSection.querySelector('.contact-info');
        const contactForm = currentSection.querySelector('.contact-form');

        if (contactTitle) { setTimeout(() => { contactTitle.style.opacity = 1; contactTitle.style.transform = 'translateY(0)'; }, 100); }
        if (contactSubtitle) { setTimeout(() => { contactSubtitle.style.opacity = 1; contactSubtitle.style.transform = 'translateY(0)'; }, 200); }
        if (contactInfo) { setTimeout(() => { contactInfo.style.opacity = 1; contactInfo.style.transform = 'translateY(0)'; }, 300); }
        if (contactForm) { setTimeout(() => { contactForm.style.opacity = 1; contactForm.style.transform = 'translateY(0)'; }, 400); }
      }

      const otherAnimatedElements = currentSection.querySelectorAll(
        '.animate-text:not(.hero-main-content h1):not(.portfolio-content h2):not(.about-content h2):not(.services-content h2):not(.contact-content h2),' +
        '.animate-text-delay:not(.hero-main-content p):not(.portfolio-content .portfolio-subtitle):not(.contact-content .contact-subtitle)'
      );
      otherAnimatedElements.forEach((el, index) => {
        setTimeout(() => {
          el.style.opacity = 1;
          el.style.transform = 'translateY(0)';
        }, 250 + (index * 100));
      });
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
  console.log("YouTube API is ready (loaded globally)");
  youtubeAPIReady = true;
  YT_API = YT;
  if (document.getElementById('youtube-player')) {
      initializePlayerForId('youtube-player');
  }
}
function onPlayerReady(event) { console.log("Player is ready"); }
function onPlayerStateChange(event) {
  console.log("Player state changed: ", event.data);
  if (player && YT_API && event.data === YT_API.PlayerState.PLAYING) {
    console.log('Video is playing.');
  }
}
function playVideo() { if (player && typeof player.playVideo === 'function') { player.playVideo(); } else { console.error("Player not available or playVideo not a function."); } }
function pauseVideo() { if (player && typeof player.pauseVideo === 'function') { player.pauseVideo(); } else { console.error("Player not available or pauseVideo not a function."); } }
function stopVideo() { if (player && typeof player.stopVideo === 'function') { player.stopVideo(); } else { console.error("Player not available or stopVideo not a function."); } }
function muteVideo() { if (player && typeof player.mute === 'function') { player.mute(); } else { console.error("Player not available or mute not a function."); } }
function unMuteVideo() { if (player && typeof player.unMute === 'function') { player.unMute(); } else { console.error("Player not available or unMute not a function."); } }