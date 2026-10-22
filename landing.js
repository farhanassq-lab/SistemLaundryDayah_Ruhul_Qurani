(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menuToggle = $('#menuToggle');

  // Cinematic intro: runs on each page visit and can be skipped immediately.
  const introScreen = $('#introScreen');
  const skipIntro = $('#skipIntro');
  let introFinished = false;
  function finishIntro() {
    if (!introScreen || introFinished) return;
    introFinished = true;
    document.documentElement.classList.remove('intro-active');
    document.body.classList.remove('intro-active');
    introScreen.classList.add('is-leaving');
    window.setTimeout(() => {
      introScreen.style.display = 'none';
      introScreen.hidden = true;
      introScreen.setAttribute('aria-hidden', 'true');
    }, 760);
  }
  if (introScreen) {
    introScreen.hidden = false;
    introScreen.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('intro-active');
    document.body.classList.add('intro-active');
    skipIntro?.addEventListener('click', finishIntro);
    const introDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 700 : 2850;
    window.setTimeout(finishIntro, introDuration);
  }

  // Gentle rising particles in the hero; capped on small screens for mobile performance.
  const particleHost = $('#heroParticles');
  if (particleHost && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const count = window.matchMedia('(max-width: 560px)').matches ? 12 : 22;
    const particleColors = ['#f7e4b1', '#dfb86c', '#e58b72', '#d7e6fb'];
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      const kind = i % 5 === 0 ? 'is-petal' : (i % 4 === 0 ? 'is-square' : (i % 3 === 0 ? 'is-glow' : ''));
      particle.className = `hero-particle ${kind}`.trim();
      particle.style.setProperty('--left', `${Math.random() * 100}%`);
      particle.style.setProperty('--size', `${3 + Math.random() * 5}px`);
      particle.style.setProperty('--duration', `${9 + Math.random() * 10}s`);
      particle.style.setProperty('--delay', `${-Math.random() * 17}s`);
      particle.style.setProperty('--drift', `${-45 + Math.random() * 90}px`);
      particle.style.setProperty('--spin', `${120 + Math.random() * 420}deg`);
      particle.style.setProperty('--particle-color', particleColors[i % particleColors.length]);
      particleHost.appendChild(particle);
    }
  }

  const navMenu = $('#navMenu');
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const toast = $('#toast');
  const dialog = $('#featureDialog');
  let toastTimer;

  const featureDetails = {
    input: {
      title: 'Input Laundry', symbol: '＋', description: 'Pencatatan laundry dirancang agar informasi utama dapat dimasukkan dengan urutan yang jelas.',
      points: ['Pilih santri dari daftar yang tersedia.', 'Isi berat laundry dan jumlah pakaian sesuai kebutuhan.', 'Hubungkan catatan dengan periode dan tahap yang sesuai.']
    },
    santri: {
      title: 'Data Santri', symbol: '♙', description: 'Data santri menjadi referensi untuk menjaga pencatatan tetap konsisten.',
      points: ['Cari dan kelola biodata santri.', 'Tampilkan jenjang dan kamar pada data terkait.', 'Periksa data sebelum digunakan untuk pencatatan laundry.']
    },
    periode: {
      title: 'Periode & Tahap', symbol: '▦', description: 'Periode dan tahap membantu mengelompokkan pekerjaan laundry secara teratur.',
      points: ['Gunakan nomor Periode 1, Periode 2, dan seterusnya.', 'Kelola urutan Tahap 1 sampai Tahap 8.', 'Jadwal aktual perlu mengikuti pengaturan sistem yang berlaku.']
    },
    laporan: {
      title: 'Laporan PDF / Excel', symbol: '▤', description: 'Laporan membantu petugas meninjau kembali data laundry dengan struktur yang lebih formal.',
      points: ['Susun data berdasarkan periode dan tahap.', 'Tampilkan jenjang serta kamar untuk memperjelas identitas santri.', 'Periksa hasil laporan sebelum dibagikan atau dicetak.']
    },
    masalah: {
      title: 'Laporan Masalah Laundry', symbol: '!', description: 'Catat kendala pakaian agar informasi dan tindak lanjut tidak hanya tersimpan di percakapan.',
      points: ['Dokumentasikan pakaian hilang, rusak, tertukar, atau kurang bersih.', 'Tambahkan keterangan dan foto jika diperlukan.', 'Siapkan pesan yang bisa ditinjau sebelum dibagikan ke grup WhatsApp.']
    }
  };

  function closeMenu() {
    if (!menuToggle || !navMenu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Buka menu');
    navMenu.classList.remove('is-open');
  }
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    navMenu?.classList.toggle('is-open', open);
  });
  $$('.nav-menu a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (navMenu?.classList.contains('is-open') && !navMenu.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  function updateScrollUI() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progress) progress.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    header?.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('in-view'));
  }

  const sections = ['beranda', 'fitur', 'pratinjau', 'pengembangan', 'tentang'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.nav-link');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => sectionObserver.observe(section));
  }

  function openFeature(key) {
    const feature = featureDetails[key];
    if (!feature || !dialog) return;
    $('#dialogTitle').textContent = feature.title;
    $('#dialogDescription').textContent = feature.description;
    $('#dialogSymbol').textContent = feature.symbol;
    const points = $('#dialogPoints');
    points.replaceChildren(...feature.points.map(text => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else showToast(`${feature.title}: ${feature.description}`);
  }
  $$('[data-feature]').forEach(button => button.addEventListener('click', () => openFeature(button.dataset.feature)));
  dialog?.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }
  $('#currentYear').textContent = new Date().getFullYear();
  // Keep local app links obvious: the landing page never touches Supabase or production data.
  $$('a[href="./index.html"]').forEach(link => link.addEventListener('click', () => {
    link.setAttribute('aria-label', 'Masuk ke aplikasi SILAS');
  }));
})();
