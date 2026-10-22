import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.2';
import autoTable from 'https://esm.sh/jspdf-autotable@3.8.4';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const configured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_URL.includes('YOUR-PROJECT') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('REPLACE_WITH_YOUR_KEY')
);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = {
  supabase: null, user: null, jenjang: [], kamar: [], santri: [], periods: [], stages: [],
  selectedStudent: null, editingStudentId: null, currentView: 'dashboard',
  issueStudent: null, issueReports: [], issueTableReady: false, issuePhotoObjectUrl: null,
  reportSettings: { id: 1, nama_dayah: "Dayah Ruhul Qur’ani", alamat: '', kontak: '', judul_laporan: 'REKAPITULASI LAUNDRY SANTRI', logo_dayah_data: null, logo_laundry_data: null, nama_direktur: '', jabatan_direktur: 'Direktur Badan Usaha Dayah Ruhul Qur’ani', kata_direktur: 'Kebersihan dan kerapian adalah bagian dari pelayanan. Semoga setiap ikhtiar memudahkan santri dalam menuntut ilmu.', foto_direktur_data: null },
  defaultDayahLogoData: null
};
const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const fmtInt = new Intl.NumberFormat('id-ID');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function initials(value) {
  return String(value || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
}
function periodLabel(period) {
  return period ? `Periode ${Number(period.nomor_periode)}` : 'Periode belum dipilih';
}
function nextPeriodNumber() {
  return state.periods.reduce((max, item) => Math.max(max, Number(item.nomor_periode) || 0), 0) + 1;
}
function dateLabel(value) {
  if (!value) return 'Tanggal belum diatur';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function shortDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

// Jadwal laundry SILAS hanya pada hari Minggu dan Kamis.
function parseLocalDate(value) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}
function toLocalISODate(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function isLaundryDay(date) {
  return Boolean(date) && [0, 4].includes(date.getDay()); // Minggu = 0, Kamis = 4
}
function generateLaundrySchedule(startDateValue, totalStages = 8) {
  const startDate = parseLocalDate(startDateValue);
  if (!isLaundryDay(startDate)) return [];
  const schedule = [{ nomor_tahap: 1, tanggal_laundry: toLocalISODate(startDate) }];
  const cursor = new Date(startDate);
  while (schedule.length < totalStages) {
    cursor.setDate(cursor.getDate() + 1);
    if (isLaundryDay(cursor)) {
      schedule.push({ nomor_tahap: schedule.length + 1, tanggal_laundry: toLocalISODate(cursor) });
    }
  }
  return schedule;
}
function weekdayLabel(value) {
  const date = parseLocalDate(value);
  return date ? date.toLocaleDateString('id-ID', { weekday: 'long' }) : '';
}
function renderStageSchedulePreview() {
  const numberInput = $('#stageNumber');
  const dateInput = $('#stageDate');
  const periodInput = $('#stagePeriod');
  if (!numberInput || !dateInput || !periodInput) return;

  let preview = $('#stageSchedulePreview');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'stageSchedulePreview';
    preview.className = 'notice-box';
    preview.style.gridColumn = '1 / -1';
    preview.style.width = '100%';
    preview.style.marginTop = '12px';
    const form = $('#stageForm');
    const message = $('#stageMessage');
    if (form && message && message.parentElement === form) form.insertBefore(preview, message);
    else if (form) form.appendChild(preview);
    else {
      const anchor = dateInput.closest('.field') || dateInput.parentElement;
      if (anchor) anchor.insertAdjacentElement('afterend', preview);
    }
  }

  const periodId = periodInput.value;
  const nomor = Number(numberInput.value);
  const tanggal = dateInput.value;
  const hasStageOne = state.stages.some(stage => stage.periode_id === periodId && Number(stage.nomor_tahap) === 1);
  if (nomor !== 1) {
    if (tanggal && !hasStageOne && periodId) {
      preview.hidden = false;
      preview.innerHTML = '<strong>Jadwal otomatis Tahap 1–8</strong><p>Mulai dengan memilih Tahap 1. Setelah tanggal Tahap 1 disimpan, tanggal Tahap 2 sampai Tahap 8 akan dibuat otomatis mengikuti jadwal Minggu dan Kamis.</p>';
    } else preview.hidden = true;
    return;
  }
  if (!tanggal) {
    preview.hidden = true;
    preview.innerHTML = '';
    return;
  }

  const schedule = generateLaundrySchedule(tanggal);
  preview.hidden = false;
  if (!schedule.length) {
    preview.innerHTML = '<strong>Tanggal belum sesuai jadwal</strong><p>Tanggal Tahap 1 harus jatuh pada hari Minggu atau Kamis. Pilih salah satu tanggal tersebut agar sistem dapat menghitung Tahap 2–8.</p>';
    return;
  }

  const existingStages = state.stages.filter(stage => stage.periode_id === periodId);
  const conflict = existingStages.find(stage => {
    const expected = schedule.find(item => item.nomor_tahap === Number(stage.nomor_tahap));
    return expected && expected.tanggal_laundry !== stage.tanggal_laundry;
  });
  const warning = conflict
    ? `<p><strong>Perhatian:</strong> Tahap ${Number(conflict.nomor_tahap)} sudah memiliki tanggal berbeda (${escapeHtml(dateLabel(conflict.tanggal_laundry))}). Sistem tidak akan mengubah jadwal yang sudah tersimpan.</p>`
    : '<p>Setelah Tahap 1 disimpan, sistem akan membuat semua tahap yang belum ada. Jadwal yang sudah tersimpan tidak akan ditimpa.</p>';
  preview.innerHTML = `<strong>Pratinjau jadwal otomatis · 8 tahap</strong>${warning}<div class="period-stages">${schedule.map(item => `<div class="period-stage"><strong>Tahap ${item.nomor_tahap}</strong><small>${escapeHtml(weekdayLabel(item.tanggal_laundry))}</small><small>${escapeHtml(dateLabel(item.tanggal_laundry))}</small></div>`).join('')}</div>`;
}
function getToastStack() {
  let stack = document.getElementById('toastContainer') || document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastContainer';
    document.body.appendChild(stack);
  }

  // Gunakan satu kelas utama agar gaya notifikasi baru konsisten.
  stack.className = 'toast-stack';
  stack.setAttribute('aria-live', 'polite');
  stack.setAttribute('aria-relevant', 'additions');
  return stack;
}

/**
 * Pemanggilan yang dipakai di seluruh aplikasi:
 * showToast(pesan, tipe, judulOpsional)
 * Contoh: showToast('Catatan berhasil disimpan.', 'success', 'Laundry tersimpan')
 */
function showToast(message, type = 'info', title = '') {
  const stack = getToastStack();
  const allowedTypes = ['success', 'error', 'warning', 'info'];
  const kind = allowedTypes.includes(type) ? type : 'info';
  const defaults = {
    success: { title: 'Berhasil', icon: '✓' },
    error: { title: 'Gagal', icon: '×' },
    warning: { title: 'Perhatian', icon: '!' },
    info: { title: 'Informasi', icon: 'i' }
  };
  const config = defaults[kind];

  const toast = document.createElement('section');
  toast.className = `toast-card toast-${kind}`;
  toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = config.icon;

  const body = document.createElement('div');
  body.className = 'toast-body';

  const heading = document.createElement('p');
  heading.className = 'toast-title';
  heading.textContent = title || config.title;

  const text = document.createElement('p');
  text.className = 'toast-text';
  text.textContent = String(message ?? '');

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Tutup notifikasi');
  close.textContent = '×';

  body.append(heading, text);
  toast.append(icon, body, close);
  stack.appendChild(toast);

  let removed = false;
  let timerId;
  const removeToast = () => {
    if (removed) return;
    removed = true;
    window.clearTimeout(timerId);
    toast.classList.add('toast-leaving');
    window.setTimeout(() => toast.remove(), 260);
  };

  close.addEventListener('click', removeToast);
  timerId = window.setTimeout(removeToast, 4800);
  return toast;
}
function showMessage(selector, message, type = 'info') {
  const el = $(selector);
  if (!el) return;
  el.textContent = message;
  el.className = `inline-message form-alert ${type}`;

  // Pesan validasi/error juga tampil sebagai toast agar mudah terlihat di HP.
  if (type === 'error') showToast(message, 'error', 'Periksa kembali');
}
function hideMessage(selector) {
  const el = $(selector);
  if (el) { el.textContent = ''; el.className = 'inline-message hidden'; }
}
function friendlyError(error) {
  const message = error?.message || 'Terjadi kesalahan yang tidak diketahui.';
  if (/duplicate key|already exists|unique constraint/i.test(message)) return 'Data dengan NIS tersebut atau catatan untuk santri dan tahap ini sudah ada.';
  if (/row-level security|permission denied|not allowed/i.test(message)) return 'Akses ditolak oleh aturan keamanan Supabase. Periksa login dan kebijakan RLS.';
  if (/invalid login credentials/i.test(message)) return 'Email atau password salah.';
  if (/email not confirmed/i.test(message)) return 'Email akun belum dikonfirmasi. Minta administrator mengaktifkan akun di Supabase.';
  if (/failed to fetch|network/i.test(message)) return 'Tidak dapat terhubung ke Supabase. Periksa internet dan konfigurasi project.';
  return message;
}
function setBusy(button, busy, busyText = 'Memproses…') {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> ${busyText}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}
function setView(view) {
  const validViews = ['dashboard', 'input', 'santri', 'tahap', 'laporan', 'masalah', 'pengaturan'];
  if (!validViews.includes(view)) view = 'dashboard';
  state.currentView = view;
  $$('.view-section').forEach(section => section.classList.toggle('hidden', section.id !== `view-${view}`));
  $$('.nav-item').forEach(item => {
    const isMobileDock = Boolean(item.closest('#mobileBottomNav'));
    const activeView = view === 'masalah' && isMobileDock ? 'laporan' : view;
    item.classList.toggle('active', item.dataset.view === activeView);
  });
  const names = {dashboard:'Dashboard', input:'Input laundry', santri:'Data santri', tahap:'Periode & tahap', laporan:'Laporan', masalah:'Laporan masalah', pengaturan:'Pengaturan laporan'};
  $('#pageBreadcrumb').textContent = names[view] || 'Dashboard';
  $('#sidebar')?.classList.remove('open');
  if (view === 'santri') renderStudents();
  if (view === 'dashboard') renderDashboard();
  if (view === 'masalah') loadIssueReports();
}
function showAuth() {
  document.body.classList.remove('app-authenticated');
  $('#authScreen').classList.remove('hidden');
  $('#appShell').classList.add('hidden');
  $('#configWarning').classList.add('hidden');
}
function showApp() {
  document.body.classList.add('app-authenticated');
  $('#authScreen').classList.add('hidden');
  $('#appShell').classList.remove('hidden');
  $('#userEmail').textContent = state.user?.email || 'Petugas';
  $('#configWarning').classList.add('hidden');
}

async function start() {
  try { state.defaultDayahLogoData = await imageUrlToDataUrl('./assets/logo-ruhul-qurani.png'); } catch (error) { console.warn('Logo default tidak dapat dimuat', error); }
  state.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  wireEvents();
  const { data, error } = await state.supabase.auth.getSession();
  if (error) console.warn(error);
  if (data?.session?.user) {
    state.user = data.session.user;
    showApp();
    await refreshAll();
  } else showAuth();
  state.supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      state.user = session.user;
      showApp();
      // Jalankan query setelah callback auth selesai untuk menghindari auth-lock.
      window.setTimeout(() => refreshAll(), 0);
    } else {
      state.user = null;
      showAuth();
    }
  });
}

function wireEvents() {
  $('#loginForm').addEventListener('submit', onLogin);
  $('#logoutBtn').addEventListener('click', async () => {
    const { error } = await state.supabase.auth.signOut();
    if (error) showToast(friendlyError(error), 'error');
    else showToast('Kamu sudah keluar.', 'success');
  });
  $$('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $$('[data-goto]').forEach(button => button.addEventListener('click', () => setView(button.dataset.goto)));
  $('#mobileMenuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#inputPeriod').addEventListener('change', () => { populateStageSelect(); loadStageRecords(); });
  $('#inputStage').addEventListener('change', loadStageRecords);
  $('#stageRecordsBody').addEventListener('click', onLaundryRecordAction);
  $('#studentSearch').addEventListener('input', onStudentSearch);
  $('#studentSearch').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') $('#studentSuggestions').classList.add('hidden');
  });
  $('#laundryForm').addEventListener('submit', onSaveLaundry);
  $('#laundryForm').addEventListener('reset', () => {
    window.setTimeout(() => {
      state.selectedStudent = null;
      $('#studentBio').classList.add('hidden');
      $('#studentSuggestions').classList.add('hidden');
      hideMessage('#laundryMessage');
      populateStageSelect();
    }, 0);
  });
  $('#showStudentFormBtn').addEventListener('click', () => openStudentForm());
  $('#cancelStudentFormBtn').addEventListener('click', closeStudentForm);
  $('#cancelStudentFormBtn2').addEventListener('click', closeStudentForm);
  $('#studentForm').addEventListener('submit', onSaveStudent);
  $('#studentLevel').addEventListener('change', () => populateRoomSelect());
  $('#studentFilter').addEventListener('input', renderStudents);
  $('#studentLevelFilter').addEventListener('change', renderStudents);
  $('#studentsBody').addEventListener('click', onStudentTableAction);
  $('#periodForm').addEventListener('submit', onCreatePeriod);
  $('#stageForm').addEventListener('submit', onCreateStage);
  ['#stageNumber', '#stagePeriod'].forEach(selector => $(selector).addEventListener('change', renderStageSchedulePreview));
  $('#stageDate').addEventListener('input', renderStageSchedulePreview);
  $('#stageDate').addEventListener('change', renderStageSchedulePreview);
  renderStageSchedulePreview();
  $('#periodsList').addEventListener('click', onPeriodListAction);
  $('#directorPhotoFile').addEventListener('change', onDirectorPhotoChange);
  $('#clearDirectorPhotoBtn').addEventListener('click', () => {
    state.reportSettings.foto_direktur_data = null;
    $('#directorPhotoFile').value = '';
    renderDirectorPhotoPreview();
    renderDirectorCard();
  });
  $('#reportForm').addEventListener('submit', onGenerateReport);
  $('#issueForm').addEventListener('submit', onSaveIssueReport);
  $('#issueStudentSearch').addEventListener('input', onIssueStudentSearch);
  $('#issueStudentSearch').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') $('#issueStudentSuggestions').classList.add('hidden');
  });
  $('#issueStudentSuggestions').addEventListener('click', onIssueStudentSuggestionClick);
  $('#issuePhoto').addEventListener('change', onIssuePhotoChange);
  $('#clearIssuePhotoBtn').addEventListener('click', clearIssuePhoto);
  $('#issueForm').addEventListener('reset', () => {
    window.setTimeout(() => {
      state.issueStudent = null;
      $('#issueStudentBio').classList.add('hidden');
      $('#issueStudentSuggestions').classList.add('hidden');
      $('#issuePhoto').value = '';
      clearIssuePhotoPreviewOnly();
      $('#issueDate').value = localDateInputValue();
      hideMessage('#issueMessage');
    }, 0);
  });
  $('#issueReportsList').addEventListener('click', onIssueReportsAction);
  $('#issueStatusFilter').addEventListener('change', renderIssueReports);
  $('#refreshIssueReportsBtn').addEventListener('click', () => loadIssueReports());
  $('#issueDate').value = localDateInputValue();
  $('#reportSettingsForm').addEventListener('submit', onSaveReportSettings);
  ['#settingDayahName','#settingAddress','#settingContact','#settingReportTitle'].forEach(sel => $(sel).addEventListener('input', updateReportSettingsPreview));
  $('#laundryLogoFile').addEventListener('change', event => onLogoFileChange(event, 'logo_laundry_data'));
  $('#dayahLogoFile').addEventListener('change', event => onLogoFileChange(event, 'logo_dayah_data'));
  $('#clearLaundryLogoBtn').addEventListener('click', () => { state.reportSettings.logo_laundry_data = null; $('#laundryLogoFile').value = ''; renderReportLogoPreviews(); });
  $('#clearDayahLogoBtn').addEventListener('click', () => { state.reportSettings.logo_dayah_data = null; $('#dayahLogoFile').value = ''; renderReportLogoPreviews(); });
  $('#resetReportSettingsBtn').addEventListener('click', resetReportSettingsForm);
}

async function onLogin(event) {
  event.preventDefault();
  $('#loginError').textContent = '';
  const button = event.submitter || $('#loginForm button[type="submit"]');
  setBusy(button, true, 'Sedang masuk…');
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value;
  const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });
  setBusy(button, false);
  if (error) {
    $('#loginError').textContent = friendlyError(error);
    return;
  }
  state.user = data.user;
  showApp();
  await refreshAll();
}

async function refreshAll() {
  try {
    const sb = state.supabase;
    const [levelsRes, roomsRes, studentsRes, periodsRes, stagesRes] = await Promise.all([
      sb.from('jenjang').select('id,nama').order('nama'),
      sb.from('kamar').select('id,nama,jenjang_id,jenjang(id,nama)').order('nama'),
      sb.from('santri').select('id,nis,nama,kamar_id,status_aktif,created_at,kamar(id,nama,jenjang(id,nama))').order('nama'),
      sb.from('periode_laundry').select('id,nomor_periode').order('nomor_periode', {ascending:false}),
      sb.from('tahap_laundry').select('id,periode_id,nomor_tahap,tanggal_laundry,status').order('nomor_tahap')
    ]);
    for (const res of [levelsRes, roomsRes, studentsRes, periodsRes, stagesRes]) {
      if (res.error) throw res.error;
    }
    state.jenjang = levelsRes.data || [];
    state.kamar = roomsRes.data || [];
    state.santri = studentsRes.data || [];
    state.periods = periodsRes.data || [];
    state.stages = stagesRes.data || [];
    populateAllSelects();
    populateIssueStageOptions();
    renderStudents();
    renderPeriods();
    renderDashboard();
    await loadReportSettings();
    if ($('#inputStage').value) await loadStageRecords();
  } catch (error) {
    console.error(error);
    showToast(`Gagal memuat data: ${friendlyError(error)}`, 'error');
  }
}

function populateAllSelects() {
  const periodOptions = state.periods.map(p => `<option value="${p.id}">${escapeHtml(periodLabel(p))}</option>`).join('');
  ['#inputPeriod','#stagePeriod','#reportPeriod'].forEach(selector => {
    const el = $(selector);
    const oldValue = el.value;
    el.innerHTML = `<option value="">Pilih periode</option>${periodOptions}`;
    if (oldValue && state.periods.some(p => p.id === oldValue)) el.value = oldValue;
  });
  const levelOptions = state.jenjang.map(level => `<option value="${level.id}">${escapeHtml(level.nama)}</option>`).join('');
  $('#studentLevel').innerHTML = `<option value="">Pilih jenjang</option>${levelOptions}`;
  const oldLevelFilter = $('#studentLevelFilter').value;
  $('#studentLevelFilter').innerHTML = `<option value="">Semua jenjang</option>${levelOptions}`;
  if (oldLevelFilter && state.jenjang.some(level => String(level.id) === oldLevelFilter)) $('#studentLevelFilter').value = oldLevelFilter;
  const latest = state.periods[0];
  if (!$('#inputPeriod').value && latest) $('#inputPeriod').value = latest.id;
  if (!$('#reportPeriod').value && latest) $('#reportPeriod').value = latest.id;
  if (!$('#stagePeriod').value && latest) $('#stagePeriod').value = latest.id;
  populateStageSelect();
  populateRoomSelect();
}

function populateStageSelect() {
  const periodId = $('#inputPeriod').value;
  const stages = state.stages.filter(stage => stage.periode_id === periodId).sort((a,b) => a.nomor_tahap - b.nomor_tahap);
  const oldValue = $('#inputStage').value;
  $('#inputStage').innerHTML = `<option value="">Pilih tahap</option>${stages.map(stage => `<option value="${stage.id}">Tahap ${stage.nomor_tahap} · ${escapeHtml(shortDate(stage.tanggal_laundry))}</option>`).join('')}`;
  if (oldValue && stages.some(stage => stage.id === oldValue)) $('#inputStage').value = oldValue;
  else if (stages.length) $('#inputStage').value = stages[0].id;
  if (!stages.length) $('#stageRecordsBody').innerHTML = '<tr><td colspan="7" class="empty-cell">Belum ada tahap untuk periode ini. Buat tahap di menu Periode & tahap.</td></tr>'; 
}

function populateRoomSelect(selectedRoomId = '') {
  const levelId = $('#studentLevel').value;
  const rooms = state.kamar.filter(room => String(room.jenjang_id) === String(levelId));
  const select = $('#studentRoom');
  select.disabled = !levelId;
  select.innerHTML = `<option value="">${levelId ? 'Pilih kamar' : 'Pilih jenjang terlebih dahulu'}</option>${rooms.map(room => `<option value="${room.id}">${escapeHtml(room.nama)}</option>`).join('')}`;
  if (selectedRoomId && rooms.some(room => String(room.id) === String(selectedRoomId))) select.value = String(selectedRoomId);
}

function renderDashboard() {
  const activeStudents = state.santri.filter(student => student.status_aktif).length;
  $('#statSantri').textContent = fmtInt.format(activeStudents);
  $('#statKamar').textContent = fmtInt.format(state.kamar.length);
  const latest = state.periods[0];
  $('#statPeriodLabel').textContent = latest ? periodLabel(latest) : 'Belum ada periode';
  if (!latest) {
    $('#statKg').textContent = '0 kg';
    $('#statTahap').textContent = '0';
    $('#dashboardStages').innerHTML = '<div class="empty-state">Belum ada periode. Buat periode pertama di menu Periode & tahap.</div>';
    return;
  }
  const stages = state.stages.filter(stage => stage.periode_id === latest.id).sort((a,b) => a.nomor_tahap - b.nomor_tahap);
  $('#dashboardStages').innerHTML = stages.length ? stages.map(stage => {
    const statusClass = stage.status === 'selesai' ? 'done' : stage.status === 'proses' ? 'progress' : '';
    const statusText = stage.status === 'selesai' ? 'Selesai' : stage.status === 'proses' ? 'Sedang diinput' : 'Belum ditutup';
    return `<div class="stage-row"><div class="stage-date-icon">${escapeHtml(shortDate(stage.tanggal_laundry))}</div><div class="stage-info"><strong>Tahap ${stage.nomor_tahap}</strong><small>${escapeHtml(dateLabel(stage.tanggal_laundry))}</small></div><span class="stage-status ${statusClass}">${statusText}</span></div>`;
  }).join('') : '<div class="empty-state">Belum ada tahap untuk periode ini. Tambahkan tahap sesuai jadwal laundry.</div>';
  const stageIds = stages.map(stage => stage.id);
  if (!stageIds.length) {
    $('#statKg').textContent = '0 kg';
    $('#statTahap').textContent = '0';
    return;
  }
  state.supabase.from('catatan_laundry').select('tahap_id,berat_kg').in('tahap_id', stageIds).then(({data,error}) => {
    if (error) { console.warn(error); return; }
    const rows = data || [];
    const total = rows.reduce((sum,row) => sum + Number(row.berat_kg || 0), 0);
    $('#statKg').textContent = `${fmt.format(total)} kg`;
    $('#statTahap').textContent = String(new Set(rows.map(row => row.tahap_id)).size);
  });
}

function onStudentSearch() {
  const query = $('#studentSearch').value.trim().toLocaleLowerCase('id-ID');
  state.selectedStudent = null;
  $('#studentBio').classList.add('hidden');
  const container = $('#studentSuggestions');
  if (query.length < 2) { container.classList.add('hidden'); container.innerHTML = ''; return; }
  const results = state.santri.filter(student => student.status_aktif && student.kamar && (
    student.nama.toLocaleLowerCase('id-ID').includes(query) || String(student.nis || '').toLocaleLowerCase('id-ID').includes(query)
  )).slice(0, 10);
  if (!results.length) {
    container.innerHTML = '<div class="empty-state">Santri tidak ditemukan. Periksa data santri atau tambahkan melalui menu Data santri.</div>';
    container.classList.remove('hidden');
    return;
  }
  container.innerHTML = results.map(student => `<button type="button" class="suggestion-item" data-student-id="${student.id}"><span class="suggestion-avatar">${escapeHtml(initials(student.nama))}</span><span><strong>${escapeHtml(student.nama)}</strong><small>${escapeHtml(student.kamar?.jenjang?.nama || 'Jenjang belum ada')} · Kamar ${escapeHtml(student.kamar?.nama || '-')} ${student.nis ? `· NIS ${escapeHtml(student.nis)}` : ''}</small></span><span aria-hidden="true">›</span></button>`).join('');
  container.classList.remove('hidden');
  container.querySelectorAll('[data-student-id]').forEach(button => button.addEventListener('click', () => selectStudent(button.dataset.studentId)));
}

function selectStudent(studentId) {
  const student = state.santri.find(item => item.id === studentId && item.status_aktif && item.kamar);
  if (!student) return;
  state.selectedStudent = student;
  $('#studentSearch').value = student.nama;
  $('#studentSuggestions').classList.add('hidden');
  const level = student.kamar?.jenjang?.nama || '-';
  const room = student.kamar?.nama || '-';
  $('#studentBio').innerHTML = `<div class="bio-top"><div class="bio-avatar">${escapeHtml(initials(student.nama))}</div><div><strong>${escapeHtml(student.nama)}</strong><small>${student.nis ? `NIS ${escapeHtml(student.nis)}` : 'NIS belum diisi'} · Santri aktif</small></div></div><div class="bio-grid"><div class="bio-item"><small>Jenjang</small><strong>${escapeHtml(level)}</strong></div><div class="bio-item"><small>Kamar</small><strong>${escapeHtml(room)}</strong></div></div>`;
  $('#studentBio').classList.remove('hidden');
}

async function onSaveLaundry(event) {
  event.preventDefault();
  hideMessage('#laundryMessage');
  const stageId = $('#inputStage').value;
  const weight = Number($('#weightInput').value);
  const piecesRaw = $('#piecesInput').value.trim();
  const pieces = piecesRaw === '' ? null : Number(piecesRaw);
  if (!stageId) return showMessage('#laundryMessage', 'Pilih periode dan tahap laundry terlebih dahulu.', 'error');
  if (!state.selectedStudent) return showMessage('#laundryMessage', 'Pilih nama santri dari daftar saran agar biodatanya terhubung.', 'error');
  if (!Number.isFinite(weight) || weight <= 0 || weight > 9999) return showMessage('#laundryMessage', 'Berat wajib berupa angka lebih dari 0 kg dan maksimal 9999 kg.', 'error');
  if (pieces !== null && (!Number.isInteger(pieces) || pieces < 0 || pieces > 100000)) return showMessage('#laundryMessage', 'Jumlah pakaian harus bilangan bulat nol atau lebih, atau dikosongkan.', 'error');
  const student = state.selectedStudent;
  const selectedStage = state.stages.find(stage => stage.id === stageId);
  if (!selectedStage) return showMessage('#laundryMessage', 'Tahap tidak ditemukan. Muat ulang data dan coba lagi.', 'error');
  const payload = {
    tahap_id: stageId,
    santri_id: student.id,
    berat_kg: Math.round(weight * 100) / 100,
    jumlah_pakaian: pieces,
    santri_nama_snapshot: student.nama,
    jenjang_nama_snapshot: student.kamar?.jenjang?.nama || '-',
    kamar_nama_snapshot: student.kamar?.nama || '-',
    created_by: state.user?.id || null
  };
  const button = $('#saveLaundryBtn');
  setBusy(button, true, 'Menyimpan…');
  const { error } = await state.supabase.from('catatan_laundry').insert(payload);
  setBusy(button, false);
  if (error) {
    const message = friendlyError(error);
    showMessage('#laundryMessage', /duplicate key|unique constraint/i.test(error.message) ? 'Santri ini sudah tercatat pada tahap tersebut. Jika perlu menambah transaksi lain, periksa aturan pencatatan dayah.' : message, 'error');
    return;
  }
  showMessage('#laundryMessage', `Catatan ${student.nama} berhasil disimpan: ${fmt.format(weight)} kg.`, 'success');
  showToast(`Catatan ${student.nama} berhasil disimpan: ${fmt.format(weight)} kg.`, 'success', 'Laundry tersimpan');
  $('#weightInput').value = '';
  $('#piecesInput').value = '';
  $('#studentSearch').value = '';
  state.selectedStudent = null;
  $('#studentBio').classList.add('hidden');
  await loadStageRecords();
  renderDashboard();
  $('#studentSearch').focus();
}

async function loadStageRecords() {
  const stageId = $('#inputStage').value;
  const tbody = $('#stageRecordsBody');
  if (!stageId) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Pilih tahap laundry.</td></tr>';
    $('#stageTotals').textContent = '0 catatan · 0 kg';
    return;
  }
  tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Memuat catatan…</td></tr>';
  const { data, error } = await state.supabase.from('catatan_laundry').select('*').eq('tahap_id', stageId).order('created_at', {ascending:false});
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">${escapeHtml(friendlyError(error))}</td></tr>`;
    return;
  }
  const rows = data || [];
  const totalKg = rows.reduce((sum,row) => sum + Number(row.berat_kg || 0), 0);
  $('#stageTotals').textContent = `${rows.length} catatan · ${fmt.format(totalKg)} kg`;
  tbody.innerHTML = rows.length ? rows.map(row => `<tr><td><div class="person-cell"><span class="mini-avatar">${escapeHtml(initials(row.santri_nama_snapshot))}</span><span><strong>${escapeHtml(row.santri_nama_snapshot)}</strong></span></div></td><td>${escapeHtml(row.jenjang_nama_snapshot)}</td><td>${escapeHtml(row.kamar_nama_snapshot)}</td><td><strong>${fmt.format(Number(row.berat_kg))} kg</strong></td><td>${row.jumlah_pakaian === null ? '<span class="muted">—</span>' : fmtInt.format(row.jumlah_pakaian)}</td><td>${escapeHtml(new Date(row.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}))}</td><td><button type="button" class="text-btn danger" data-delete-record="${escapeHtml(row.id)}" data-record-name="${escapeHtml(row.santri_nama_snapshot)}">Hapus</button></td></tr>`).join('') : '<tr><td colspan="7" class="empty-cell">Belum ada catatan untuk tahap ini.</td></tr>';
}

async function onLaundryRecordAction(event) {
  const button = event.target.closest('[data-delete-record]');
  if (!button) return;
  const recordId = button.dataset.deleteRecord;
  const studentName = button.dataset.recordName || 'catatan ini';
  const confirmed = window.confirm(`Hapus catatan laundry ${studentName}? Tindakan ini permanen dan akan mengubah total laporan.`);
  if (!confirmed) return;
  setBusy(button, true, 'Menghapus…');
  const { error } = await state.supabase.from('catatan_laundry').delete().eq('id', recordId);
  if (error) {
    showToast(`Catatan belum berhasil dihapus: ${friendlyError(error)}`, 'error', 'Gagal menghapus catatan');
    setBusy(button, false);
    return;
  }
  showToast(`Catatan laundry ${studentName} berhasil dihapus.`, 'success', 'Catatan dihapus');
  await loadStageRecords();
  await renderDashboard();
}

function openStudentForm(student = null) {
  state.editingStudentId = student?.id || null;
  $('#studentForm').reset();
  $('#studentId').value = student?.id || '';
  $('#studentName').value = student?.nama || '';
  $('#studentNis').value = student?.nis || '';
  $('#studentActive').checked = student ? Boolean(student.status_aktif) : true;
  $('#studentFormTitle').textContent = student ? 'Edit data santri' : 'Tambah santri baru';
  $('#saveStudentBtn').textContent = student ? 'Simpan perubahan' : 'Simpan santri';
  $('#studentLevel').value = student?.kamar?.jenjang?.id ? String(student.kamar.jenjang.id) : '';
  populateRoomSelect(student?.kamar_id ? String(student.kamar_id) : '');
  hideMessage('#studentMessage');
  $('#studentFormPanel').classList.remove('hidden');
  $('#studentFormPanel').scrollIntoView({behavior:'smooth',block:'start'});
  $('#studentName').focus();
}
function closeStudentForm() {
  $('#studentFormPanel').classList.add('hidden');
  $('#studentForm').reset();
  state.editingStudentId = null;
  hideMessage('#studentMessage');
}

async function onSaveStudent(event) {
  event.preventDefault();
  hideMessage('#studentMessage');
  const name = $('#studentName').value.trim().replace(/\s+/g, ' ');
  const nisRaw = $('#studentNis').value.trim();
  const nis = nisRaw || null;
  const levelId = $('#studentLevel').value;
  const roomId = $('#studentRoom').value;
  const active = $('#studentActive').checked;
  if (!name) return showMessage('#studentMessage', 'Nama santri wajib diisi.', 'error');
  if (!levelId || !roomId) return showMessage('#studentMessage', 'Pilih jenjang dan kamar. Santri tanpa kamar tidak dimasukkan ke daftar laundry.', 'error');
  const room = state.kamar.find(item => String(item.id) === String(roomId));
  if (!room || String(room.jenjang_id) !== String(levelId)) return showMessage('#studentMessage', 'Kamar tidak sesuai dengan jenjang yang dipilih.', 'error');
  const payload = { nama: name, nis, kamar_id: Number(roomId), status_aktif: active };
  const button = $('#saveStudentBtn');
  setBusy(button, true, 'Menyimpan…');
  let result;
  if (state.editingStudentId) result = await state.supabase.from('santri').update(payload).eq('id', state.editingStudentId);
  else result = await state.supabase.from('santri').insert(payload);
  setBusy(button, false);
  if (result.error) {
    showMessage('#studentMessage', friendlyError(result.error), 'error');
    return;
  }
  showMessage('#studentMessage', state.editingStudentId ? 'Data santri berhasil diperbarui.' : 'Santri baru berhasil ditambahkan.', 'success');
  showToast(state.editingStudentId ? 'Data santri diperbarui.' : 'Santri berhasil ditambahkan.', 'success');
  await refreshAll();
  closeStudentForm();
}

function renderStudents() {
  if (!$('#studentsBody')) return;
  const query = ($('#studentFilter')?.value || '').trim().toLocaleLowerCase('id-ID');
  const levelFilter = $('#studentLevelFilter')?.value || '';
  const filtered = state.santri.filter(student => {
    const haystack = `${student.nama} ${student.nis || ''} ${student.kamar?.nama || ''} ${student.kamar?.jenjang?.nama || ''}`.toLocaleLowerCase('id-ID');
    const levelMatch = !levelFilter || String(student.kamar?.jenjang?.id) === String(levelFilter);
    return haystack.includes(query) && levelMatch;
  });
  $('#studentCountLabel').textContent = `${fmtInt.format(filtered.length)} dari ${fmtInt.format(state.santri.length)} santri`;
  $('#studentsBody').innerHTML = filtered.length ? filtered.map(student => `<tr><td><div class="person-cell"><span class="mini-avatar">${escapeHtml(initials(student.nama))}</span><span><strong>${escapeHtml(student.nama)}</strong><small>${student.nis ? `NIS ${escapeHtml(student.nis)}` : 'NIS belum diisi'}</small></span></div></td><td>${escapeHtml(student.nis || '—')}</td><td>${escapeHtml(student.kamar?.jenjang?.nama || '—')}</td><td>${escapeHtml(student.kamar?.nama || '—')}</td><td><span class="status-tag ${student.status_aktif ? 'active' : 'inactive'}">${student.status_aktif ? 'Aktif' : 'Nonaktif'}</span></td><td><div class="table-actions"><button class="text-btn" data-student-action="edit" data-id="${student.id}">Edit</button><button class="text-btn ${student.status_aktif ? 'danger' : ''}" data-student-action="toggle" data-id="${student.id}">${student.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}</button></div></td></tr>`).join('') : '<tr><td colspan="6" class="empty-cell">Tidak ada data santri yang cocok.</td></tr>';
}

async function onStudentTableAction(event) {
  const button = event.target.closest('[data-student-action]');
  if (!button) return;
  const student = state.santri.find(item => item.id === button.dataset.id);
  if (!student) return;
  if (button.dataset.studentAction === 'edit') return openStudentForm(student);
  const nextStatus = !student.status_aktif;
  const confirmed = window.confirm(`${nextStatus ? 'Aktifkan' : 'Nonaktifkan'} santri ${student.nama}? ${nextStatus ? 'Santri akan muncul pada pencarian laundry.' : 'Santri tidak akan muncul pada pencarian laundry.'}`);
  if (!confirmed) return;
  const { error } = await state.supabase.from('santri').update({status_aktif:nextStatus}).eq('id', student.id);
  if (error) return showToast(friendlyError(error), 'error');
  showToast(`Status ${student.nama} berhasil diperbarui.`, 'success');
  await refreshAll();
}

async function onCreatePeriod(event) {
  event.preventDefault();
  hideMessage('#periodMessage');
  const nomor_periode = nextPeriodNumber();
  const button = event.submitter;
  setBusy(button, true, 'Membuat…');
  const { data, error } = await state.supabase.from('periode_laundry').insert({nomor_periode}).select().single();
  setBusy(button, false);
  if (error) return showMessage('#periodMessage', `${friendlyError(error)}. Pastikan script migrasi periode SILAS sudah dijalankan di Supabase SQL Editor.`, 'error');
  showMessage('#periodMessage', `${periodLabel(data)} berhasil dibuat. Selanjutnya tambahkan tahap yang diperlukan (1–8).`, 'success');
  showToast(`${periodLabel(data)} berhasil dibuat.`, 'success', 'Periode dibuat');
  await refreshAll();
  $('#stagePeriod').value = data.id;
  $('#inputPeriod').value = data.id;
  $('#reportPeriod').value = data.id;
  populateStageSelect();
  $('#nextPeriodPreview').textContent = nextPeriodNumber();
}

async function onCreateStage(event) {
  event.preventDefault();
  hideMessage('#stageMessage');
  const periodId = $('#stagePeriod').value;
  const nomor = Number($('#stageNumber').value);
  const tanggal = $('#stageDate').value;
  const period = state.periods.find(item => item.id === periodId);
  if (!period) return showMessage('#stageMessage', 'Pilih periode yang valid.', 'error');
  if (!Number.isInteger(nomor) || nomor < 1 || nomor > 8) return showMessage('#stageMessage', 'Nomor tahap harus antara 1 dan 8.', 'error');
  if (!tanggal) return showMessage('#stageMessage', 'Tanggal laundry wajib diisi.', 'error');

  const existingStages = state.stages.filter(stage => stage.periode_id === periodId);
  if (existingStages.some(stage => Number(stage.nomor_tahap) === nomor)) {
    return showMessage('#stageMessage', `Tahap ${nomor} sudah dibuat pada ${periodLabel(period)}.`, 'error');
  }

  const stageOne = existingStages.find(stage => Number(stage.nomor_tahap) === 1);
  if (nomor !== 1 && !stageOne) {
    return showMessage('#stageMessage', 'Buat Tahap 1 terlebih dahulu. Setelah itu sistem dapat menentukan tanggal Tahap 2–8 secara otomatis.', 'error');
  }

  if (!isLaundryDay(parseLocalDate(tanggal))) {
    return showMessage('#stageMessage', 'Jadwal laundry hanya hari Minggu dan Kamis. Pilih tanggal yang jatuh pada salah satu hari tersebut.', 'error');
  }

  let rowsToInsert;
  let createdCount;
  if (nomor === 1) {
    const schedule = generateLaundrySchedule(tanggal, 8);
    if (schedule.length !== 8) return showMessage('#stageMessage', 'Tanggal Tahap 1 tidak valid. Pilih hari Minggu atau Kamis.', 'error');

    // Jangan mengubah tahap lama yang mungkin sudah memiliki catatan laundry.
    // Jika tanggal tahap lama bentrok dengan jadwal baru, hentikan agar data tetap aman.
    const conflict = existingStages.find(stage => {
      const expected = schedule.find(item => item.nomor_tahap === Number(stage.nomor_tahap));
      return expected && expected.tanggal_laundry !== stage.tanggal_laundry;
    });
    if (conflict) {
      return showMessage('#stageMessage', `Tahap ${Number(conflict.nomor_tahap)} sudah tersimpan pada ${dateLabel(conflict.tanggal_laundry)}, berbeda dari jadwal otomatis. Data lama tidak diubah. Periksa tahap yang sudah ada terlebih dahulu.`, 'error');
    }

    const existingNumbers = new Set(existingStages.map(stage => Number(stage.nomor_tahap)));
    rowsToInsert = schedule
      .filter(item => !existingNumbers.has(item.nomor_tahap))
      .map(item => ({
        periode_id: periodId,
        nomor_tahap: item.nomor_tahap,
        tanggal_laundry: item.tanggal_laundry,
        status: 'belum'
      }));
    createdCount = rowsToInsert.length;
  } else {
    const schedule = generateLaundrySchedule(stageOne.tanggal_laundry, 8);
    const expected = schedule.find(item => item.nomor_tahap === nomor);
    if (expected && expected.tanggal_laundry !== tanggal) {
      return showMessage('#stageMessage', `Tahap ${nomor} seharusnya jatuh pada ${weekdayLabel(expected.tanggal_laundry)}, ${dateLabel(expected.tanggal_laundry)}.`, 'error');
    }
    rowsToInsert = [{ periode_id: periodId, nomor_tahap: nomor, tanggal_laundry: tanggal, status: 'belum' }];
    createdCount = 1;
  }

  if (!rowsToInsert.length) {
    return showMessage('#stageMessage', 'Semua tahap 1–8 sudah tersedia untuk periode ini.', 'info');
  }

  const button = event.submitter;
  setBusy(button, true, nomor === 1 ? 'Membuat jadwal 1–8…' : 'Menambahkan…');
  const { error } = await state.supabase.from('tahap_laundry').insert(rowsToInsert);
  setBusy(button, false);
  if (error) return showMessage('#stageMessage', friendlyError(error), 'error');

  if (nomor === 1) {
    showMessage('#stageMessage', `Jadwal ${periodLabel(period)} berhasil dibuat. ${createdCount} tahap baru disimpan; jadwal laundry mengikuti hari Minggu dan Kamis sampai Tahap 8.`, 'success');
    showToast('Jadwal laundry Tahap 1–8 berhasil dibuat otomatis.', 'success', 'Jadwal dibuat');
  } else {
    showMessage('#stageMessage', `Tahap ${nomor} berhasil ditambahkan untuk ${periodLabel(period)}.`, 'success');
    showToast(`Tahap ${nomor} berhasil ditambahkan.`, 'success', 'Tahap ditambahkan');
  }

  $('#stageNumber').value = '';
  $('#stageDate').value = '';
  await refreshAll();
  $('#stagePeriod').value = periodId;
  $('#inputPeriod').value = periodId;
  populateStageSelect();
  renderStageSchedulePreview();
}

function renderPeriods() {
  const container = $('#periodsList');
  if (!state.periods.length) {
    container.innerHTML = '<div class="empty-state">Belum ada periode. Buat Periode 1 terlebih dahulu.</div>';
    $('#nextPeriodPreview').textContent = '1';
    return;
  }
  $('#nextPeriodPreview').textContent = nextPeriodNumber();
  container.innerHTML = state.periods.map(period => {
    const stages = state.stages.filter(stage => stage.periode_id === period.id).sort((a,b) => a.nomor_tahap - b.nomor_tahap);
    return `<div class="period-card"><div class="period-card-head"><div><strong>${escapeHtml(periodLabel(period))}</strong><small>${stages.length} dari 8 tahap dibuat</small></div><span class="pill ${stages.length ? 'pill-blue' : ''}">${stages.length}/8 tahap</span></div><div class="period-stages">${Array.from({length:8},(_,idx)=>{const stage=stages.find(item=>Number(item.nomor_tahap)===idx+1);return `<div class="period-stage ${stage?'stage-created':'stage-missing'}"><strong>Tahap ${idx+1}</strong><small>${stage?escapeHtml(dateLabel(stage.tanggal_laundry)):'Belum dibuat'}</small><small>${stage?(stage.status === 'selesai' ? 'Selesai' : stage.status === 'proses' ? 'Sedang diinput' : 'Belum ditutup'):'—'}</small>${stage?`<button type="button" class="stage-delete-btn" data-delete-stage="${escapeHtml(stage.id)}" aria-label="Hapus Tahap ${idx+1}">Hapus tahap</button>`:''}</div>`}).join('')}</div></div>`;
  }).join('');
}

async function onPeriodListAction(event) {
  const button = event.target.closest('[data-delete-stage]');
  if (!button) return;
  const stageId = button.dataset.deleteStage;
  const stage = state.stages.find(item => item.id === stageId);
  if (!stage) return;
  const period = state.periods.find(item => item.id === stage.periode_id);
  const label = `${periodLabel(period)} · Tahap ${stage.nomor_tahap}`;
  const confirmed = window.confirm(`Hapus ${label}? Semua catatan laundry pada tahap ini juga akan dihapus dan tidak bisa dipulihkan. Pastikan laporan yang diperlukan sudah diunduh.`);
  if (!confirmed) return;
  setBusy(button, true, 'Menghapus…');
  try {
    const { error: recordsError } = await state.supabase
      .from('catatan_laundry').delete().eq('tahap_id', stageId);
    if (recordsError) throw recordsError;
    const { error: stageError } = await state.supabase
      .from('tahap_laundry').delete().eq('id', stageId);
    if (stageError) throw stageError;
    showToast(`${label} berhasil dihapus.`, 'success', 'Tahap dihapus');
    await refreshAll();
  } catch (error) {
    console.error(error);
    showToast(`Tahap belum berhasil dihapus: ${friendlyError(error)}`, 'error', 'Gagal menghapus tahap');
  } finally {
    setBusy(button, false);
  }
}


const ISSUE_BUCKET = 'silas-laporan-masalah';
const ISSUE_TYPE_LABELS = {
  hilang: 'Pakaian hilang',
  rusak: 'Pakaian rusak',
  tidak_bersih: 'Pakaian tidak bersih / masih bernoda',
  tertukar: 'Pakaian tertukar',
  jumlah_kurang: 'Jumlah pakaian kurang',
  basah: 'Pakaian masih basah',
  bau: 'Pakaian berbau tidak sedap',
  lainnya: 'Masalah lainnya'
};
const ISSUE_STATUS_LABELS = {
  baru: 'Baru dilaporkan',
  diperiksa: 'Sedang diperiksa',
  selesai: 'Selesai'
};

function localDateInputValue() {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function populateIssueStageOptions() {
  const select = $('#issueStage');
  if (!select) return;
  const oldValue = select.value;
  const options = state.stages
    .slice()
    .sort((a, b) => {
      const pa = state.periods.find(p => p.id === a.periode_id);
      const pb = state.periods.find(p => p.id === b.periode_id);
      return (Number(pb?.nomor_periode || 0) - Number(pa?.nomor_periode || 0)) ||
        (Number(a.nomor_tahap || 0) - Number(b.nomor_tahap || 0));
    })
    .map(stage => {
      const period = state.periods.find(p => p.id === stage.periode_id);
      return `<option value="${escapeHtml(stage.id)}">${escapeHtml(periodLabel(period))} · Tahap ${Number(stage.nomor_tahap)} · ${escapeHtml(shortDate(stage.tanggal_laundry))}</option>`;
    }).join('');
  select.innerHTML = `<option value="">Tidak diketahui / tidak terkait tahap</option>${options}`;
  if (oldValue && state.stages.some(stage => stage.id === oldValue)) select.value = oldValue;
}

function onIssueStudentSearch() {
  const query = $('#issueStudentSearch').value.trim().toLocaleLowerCase('id-ID');
  state.issueStudent = null;
  $('#issueStudentBio').classList.add('hidden');
  const container = $('#issueStudentSuggestions');
  if (query.length < 2) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }
  const results = state.santri.filter(student => student.status_aktif && student.kamar && (
    String(student.nama || '').toLocaleLowerCase('id-ID').includes(query) ||
    String(student.nis || '').toLocaleLowerCase('id-ID').includes(query)
  )).slice(0, 10);
  if (!results.length) {
    container.innerHTML = '<div class="empty-state">Santri tidak ditemukan. Periksa ejaan atau data santri di SILAS.</div>';
    container.classList.remove('hidden');
    return;
  }
  container.innerHTML = results.map(student => `
    <button type="button" class="suggestion-item" data-issue-student-id="${escapeHtml(student.id)}">
      <span class="suggestion-avatar">${escapeHtml(initials(student.nama))}</span>
      <span><strong>${escapeHtml(student.nama)}</strong><small>${escapeHtml(student.kamar?.jenjang?.nama || 'Jenjang belum ada')} · Kamar ${escapeHtml(student.kamar?.nama || '-')} ${student.nis ? `· NIS ${escapeHtml(student.nis)}` : ''}</small></span>
      <span aria-hidden="true">›</span>
    </button>`).join('');
  container.classList.remove('hidden');
}

function onIssueStudentSuggestionClick(event) {
  const button = event.target.closest('[data-issue-student-id]');
  if (!button) return;
  const student = state.santri.find(item => String(item.id) === String(button.dataset.issueStudentId) && item.status_aktif && item.kamar);
  if (!student) return;
  state.issueStudent = student;
  $('#issueStudentSearch').value = student.nama;
  $('#issueStudentSuggestions').classList.add('hidden');
  $('#issueStudentBio').innerHTML = `
    <div class="bio-top"><div class="bio-avatar">${escapeHtml(initials(student.nama))}</div>
      <div><strong>${escapeHtml(student.nama)}</strong><small>${student.nis ? `NIS ${escapeHtml(student.nis)}` : 'NIS belum diisi'} · Santri aktif</small></div></div>
    <div class="bio-grid"><div class="bio-item"><small>Jenjang</small><strong>${escapeHtml(student.kamar?.jenjang?.nama || '-')}</strong></div>
    <div class="bio-item"><small>Kamar</small><strong>${escapeHtml(student.kamar?.nama || '-')}</strong></div></div>`;
  $('#issueStudentBio').classList.remove('hidden');
}

function clearIssuePhotoPreviewOnly() {
  if (state.issuePhotoObjectUrl) {
    URL.revokeObjectURL(state.issuePhotoObjectUrl);
    state.issuePhotoObjectUrl = null;
  }
  $('#issuePhotoPreviewImage').removeAttribute('src');
  $('#issuePhotoName').textContent = 'Foto bukti';
  $('#issuePhotoPreview').classList.add('hidden');
}

function clearIssuePhoto() {
  $('#issuePhoto').value = '';
  clearIssuePhotoPreviewOnly();
}

function onIssuePhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    clearIssuePhotoPreviewOnly();
    return;
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    clearIssuePhoto();
    showMessage('#issueMessage', 'Format foto harus JPG, PNG, atau WebP.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    clearIssuePhoto();
    showMessage('#issueMessage', 'Ukuran foto maksimal 5 MB.', 'error');
    return;
  }
  if (state.issuePhotoObjectUrl) URL.revokeObjectURL(state.issuePhotoObjectUrl);
  state.issuePhotoObjectUrl = URL.createObjectURL(file);
  $('#issuePhotoPreviewImage').src = state.issuePhotoObjectUrl;
  $('#issuePhotoName').textContent = file.name;
  $('#issuePhotoPreview').classList.remove('hidden');
  hideMessage('#issueMessage');
}

async function onSaveIssueReport(event) {
  event.preventDefault();
  hideMessage('#issueMessage');

  if (!state.supabase || !state.user) {
    return showMessage('#issueMessage', 'Silakan login terlebih dahulu.', 'error');
  }
  if (!state.issueStudent) {
    return showMessage('#issueMessage', 'Pilih nama santri dari daftar saran agar jenjang dan kamar terisi otomatis.', 'error');
  }

  const type = $('#issueType').value;
  const itemName = $('#issueItemName').value.trim();
  const quantity = Number($('#issueQuantity').value);
  const date = $('#issueDate').value;
  const stageId = $('#issueStage').value || null;
  const description = $('#issueDescription').value.trim();
  const photo = $('#issuePhoto').files?.[0] || null;

  if (!ISSUE_TYPE_LABELS[type]) return showMessage('#issueMessage', 'Pilih jenis masalah yang valid.', 'error');
  if (!itemName) return showMessage('#issueMessage', 'Nama atau jenis pakaian wajib diisi.', 'error');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) return showMessage('#issueMessage', 'Jumlah pakaian harus angka bulat dari 1 sampai 100.', 'error');
  if (!date || !parseLocalDate(date)) return showMessage('#issueMessage', 'Tanggal ditemukan wajib diisi dengan benar.', 'error');
  if (!description) return showMessage('#issueMessage', 'Keterangan masalah wajib diisi.', 'error');
  if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024)) {
    return showMessage('#issueMessage', 'Foto harus JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.', 'error');
  }

  const student = state.issueStudent;
  const saveButton = $('#saveIssueBtn');
  let uploadedPath = null;
  setBusy(saveButton, true, 'Menyimpan laporan…');
  try {
    if (photo) {
      const extension = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const randomPart = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      uploadedPath = `${state.user.id}/${Date.now()}-${randomPart}.${extension}`;
      const { error: uploadError } = await state.supabase.storage.from(ISSUE_BUCKET).upload(uploadedPath, photo, {
        cacheControl: '3600',
        upsert: false,
        contentType: photo.type
      });
      if (uploadError) throw uploadError;
    }

    const payload = {
      santri_id: student.id,
      santri_nama_snapshot: student.nama,
      jenjang_nama_snapshot: student.kamar?.jenjang?.nama || '-',
      kamar_nama_snapshot: student.kamar?.nama || '-',
      jenis_masalah: type,
      nama_pakaian: itemName,
      jumlah_pakaian: quantity,
      deskripsi: description,
      tanggal_ditemukan: date,
      tahap_id: stageId,
      status: 'baru',
      foto_path: uploadedPath,
      created_by: state.user.id
    };
    const { data, error } = await state.supabase.from('laporan_masalah_laundry').insert(payload).select('*').single();
    if (error) throw error;

    showMessage('#issueMessage', `Laporan ${ISSUE_TYPE_LABELS[type].toLowerCase()} berhasil disimpan.`, 'success');
    showToast('Laporan masalah berhasil disimpan.', 'success', 'Laporan tersimpan');
    $('#issueForm').reset();
    state.issueStudent = null;
    $('#issueStudentBio').classList.add('hidden');
    $('#issueDate').value = localDateInputValue();
    await loadIssueReports({ silent: true });
  } catch (error) {
    console.error('Simpan laporan masalah gagal:', error);
    if (uploadedPath) {
      const { error: removeError } = await state.supabase.storage.from(ISSUE_BUCKET).remove([uploadedPath]);
      if (removeError) console.warn('Foto sementara gagal dibersihkan:', removeError);
    }
    const message = /relation .* does not exist|could not find the table|schema cache/i.test(error?.message || '')
      ? 'Tabel laporan masalah belum tersedia. Jalankan file SQL migration SILAS_Laporan_Masalah.sql di Supabase SQL Editor terlebih dahulu.'
      : /bucket not found|not found/i.test(error?.message || '')
        ? 'Bucket foto belum tersedia. Jalankan file SQL migration SILAS_Laporan_Masalah.sql di Supabase SQL Editor.'
        : friendlyError(error);
    showMessage('#issueMessage', message, 'error');
  } finally {
    setBusy(saveButton, false);
  }
}

async function loadIssueReports({ silent = false } = {}) {
  if (!state.supabase || !state.user) return;
  const container = $('#issueReportsList');
  if (!container) return;
  container.innerHTML = '<div class="empty-state">Memuat laporan masalah…</div>';
  const { data, error } = await state.supabase
    .from('laporan_masalah_laundry')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    state.issueTableReady = false;
    const missing = /relation .* does not exist|could not find the table|schema cache/i.test(error.message || '');
    container.innerHTML = `<div class="empty-state issue-load-error"><strong>${missing ? 'Modul database belum diaktifkan.' : 'Laporan belum dapat dimuat.'}</strong><p>${missing ? 'Jalankan file SQL migration SILAS_Laporan_Masalah.sql di Supabase → SQL Editor, lalu muat ulang halaman ini.' : escapeHtml(friendlyError(error))}</p></div>`;
    if (!silent) showToast(missing ? 'Jalankan SQL migration modul Laporan Masalah terlebih dahulu.' : friendlyError(error), 'error');
    return;
  }
  state.issueTableReady = true;
  state.issueReports = data || [];
  await renderIssueReports();
}

async function renderIssueReports() {
  const container = $('#issueReportsList');
  if (!container) return;
  const filter = $('#issueStatusFilter')?.value || '';
  const rows = state.issueReports.filter(item => !filter || item.status === filter);
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">${state.issueTableReady ? 'Belum ada laporan pada filter ini.' : 'Buka halaman ini untuk memuat laporan masalah.'}</div>`;
    return;
  }

  const cards = await Promise.all(rows.map(async issue => {
    let photoUrl = '';
    if (issue.foto_path && state.supabase) {
      const { data } = await state.supabase.storage.from(ISSUE_BUCKET).createSignedUrl(issue.foto_path, 60 * 60);
      photoUrl = data?.signedUrl || '';
    }
    const stage = state.stages.find(item => item.id === issue.tahap_id);
    const period = stage ? state.periods.find(item => item.id === stage.periode_id) : null;
    const stageLabel = stage ? `${periodLabel(period)} · Tahap ${Number(stage.nomor_tahap)}` : 'Tahap tidak dicantumkan';
    const statusClass = issue.status === 'selesai' ? 'resolved' : issue.status === 'diperiksa' ? 'checking' : 'new';
    const statusOptions = Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${issue.status === value ? 'selected' : ''}>${label}</option>`).join('');
    return `
      <article class="issue-report-card" data-issue-card="${escapeHtml(issue.id)}">
        <div class="issue-report-topline">
          <span class="issue-type-badge">${escapeHtml(ISSUE_TYPE_LABELS[issue.jenis_masalah] || 'Masalah laundry')}</span>
          <span class="issue-status-badge ${statusClass}">${escapeHtml(ISSUE_STATUS_LABELS[issue.status] || issue.status || 'Baru dilaporkan')}</span>
        </div>
        <div class="issue-report-main">
          <div class="issue-report-avatar">${escapeHtml(initials(issue.santri_nama_snapshot))}</div>
          <div class="issue-report-identity"><strong>${escapeHtml(issue.santri_nama_snapshot)}</strong><small>${escapeHtml(issue.jenjang_nama_snapshot || '-')} · Kamar ${escapeHtml(issue.kamar_nama_snapshot || '-')}</small></div>
          <div class="issue-report-date">${escapeHtml(dateLabel(issue.tanggal_ditemukan))}</div>
        </div>
        <div class="issue-report-details">
          <div><small>Pakaian</small><strong>${escapeHtml(issue.nama_pakaian)}</strong></div>
          <div><small>Jumlah</small><strong>${fmtInt.format(Number(issue.jumlah_pakaian || 0))} potong</strong></div>
          <div class="wide"><small>Tahap</small><strong>${escapeHtml(stageLabel)}</strong></div>
          <div class="wide"><small>Keterangan</small><p>${escapeHtml(issue.deskripsi)}</p></div>
        </div>
        ${photoUrl ? `<a class="issue-photo-link" href="${escapeHtml(photoUrl)}" target="_blank" rel="noopener noreferrer"><img class="issue-photo-thumb" src="${escapeHtml(photoUrl)}" alt="Foto bukti laporan"><span>↗ Lihat foto bukti</span></a>` : '<div class="issue-no-photo">Foto bukti tidak dilampirkan</div>'}
        <div class="issue-report-actions">
          <label class="issue-status-control"><span>Status tindak lanjut</span><select class="issue-status-select" aria-label="Status tindak lanjut">${statusOptions}</select></label>
          <button class="btn btn-light btn-sm" type="button" data-issue-action="status" data-issue-id="${escapeHtml(issue.id)}">Simpan status</button>
          <button class="btn btn-whatsapp btn-sm" type="button" data-issue-action="whatsapp" data-issue-id="${escapeHtml(issue.id)}">☏ WhatsApp</button>
        </div>
      </article>`;
  }));
  container.innerHTML = cards.join('');
}

function buildIssueWhatsAppMessage(issue) {
  const typeLabel = ISSUE_TYPE_LABELS[issue.jenis_masalah] || 'Masalah laundry';
  const stage = state.stages.find(item => item.id === issue.tahap_id);
  const period = stage ? state.periods.find(item => item.id === stage.periode_id) : null;
  const stageLabel = stage ? `${periodLabel(period)} · Tahap ${Number(stage.nomor_tahap)} · ${dateLabel(stage.tanggal_laundry)}` : 'Tidak dicantumkan';
  return [
    '📋 LAPORAN MASALAH LAUNDRY — SILAS',
    '',
    'Assalamu’alaikum warahmatullahi wabarakatuh.',
    '',
    'Izin melaporkan temuan pada proses laundry:',
    '',
    `• Jenis masalah: ${typeLabel}`,
    `• Nama santri: ${issue.santri_nama_snapshot}`,
    `• Jenjang: ${issue.jenjang_nama_snapshot || '-'}`,
    `• Kamar: ${issue.kamar_nama_snapshot || '-'}`,
    `• Pakaian: ${issue.nama_pakaian}`,
    `• Jumlah: ${Number(issue.jumlah_pakaian || 0)} potong`,
    `• Tanggal ditemukan: ${dateLabel(issue.tanggal_ditemukan)}`,
    `• Tahap laundry: ${stageLabel}`,
    `• Keterangan: ${issue.deskripsi}`,
    '',
    issue.foto_path ? '📸 Foto bukti ikut dibagikan jika WhatsApp mendukung berbagi foto.' : '',
    'Mohon bantuan petugas untuk memeriksa dan menindaklanjuti laporan ini.',
    '',
    'Terima kasih.',
    'Wassalamu’alaikum warahmatullahi wabarakatuh.'
  ].filter(Boolean).join('\n');
}

async function shareIssueReportToWhatsApp(issueId, button) {
  const issue = state.issueReports.find(item => String(item.id) === String(issueId));
  if (!issue) return showToast('Laporan tidak ditemukan. Muat ulang daftar dan coba lagi.', 'error');
  const message = buildIssueWhatsAppMessage(issue);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  if (!issue.foto_path) {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Buka jendela cadangan secara sinkron agar browser tidak memblokirnya jika file sharing tidak tersedia.
  const fallbackWindow = window.open('about:blank', '_blank');
  setBusy(button, true, 'Menyiapkan foto…');
  try {
    const { data, error } = await state.supabase.storage.from(ISSUE_BUCKET).download(issue.foto_path);
    if (error) throw error;
    const fileType = data?.type || 'image/jpeg';
    const file = new File([data], `SILAS-bukti-${issue.id}.${fileType.includes('png') ? 'png' : fileType.includes('webp') ? 'webp' : 'jpg'}`, { type: fileType });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.close();
      await navigator.share({ files: [file], text: message, title: 'Laporan Masalah Laundry SILAS' });
      showToast('Pilih WhatsApp lalu pilih grup laundry untuk mengirim pesan dan foto.', 'info', 'Siap dibagikan');
      return;
    }

    try { await navigator.clipboard.writeText(message); } catch (clipboardError) { console.warn('Clipboard tidak tersedia:', clipboardError); }
    if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.location.href = whatsappUrl;
    else window.location.href = whatsappUrl;
    showToast('Pesan dibuka di WhatsApp. Lampirkan foto yang sudah diunduh secara manual jika diperlukan.', 'info', 'Pesan disiapkan');
  } catch (error) {
    console.error('Berbagi foto gagal:', error);
    try { await navigator.clipboard.writeText(message); } catch (clipboardError) { console.warn(clipboardError); }
    if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.location.href = whatsappUrl;
    else window.location.href = whatsappUrl;
    showToast('Pesan WhatsApp disiapkan. Jika foto tidak ikut, lampirkan foto dari galeri secara manual.', 'info', 'Mode cadangan');
  } finally {
    setBusy(button, false);
  }
}

async function onIssueReportsAction(event) {
  const button = event.target.closest('[data-issue-action]');
  if (!button) return;
  const issueId = button.dataset.issueId;
  const issue = state.issueReports.find(item => String(item.id) === String(issueId));
  if (!issue) return;
  if (button.dataset.issueAction === 'whatsapp') {
    await shareIssueReportToWhatsApp(issueId, button);
    return;
  }
  if (button.dataset.issueAction === 'status') {
    const card = button.closest('.issue-report-card');
    const status = card?.querySelector('.issue-status-select')?.value;
    if (!ISSUE_STATUS_LABELS[status]) return showToast('Pilih status yang valid.', 'error');
    setBusy(button, true, 'Menyimpan…');
    const now = new Date().toISOString();
    const payload = {
      status,
      updated_at: now,
      resolved_at: status === 'selesai' ? now : null,
      resolved_by: status === 'selesai' ? state.user?.id || null : null
    };
    const { error } = await state.supabase.from('laporan_masalah_laundry').update(payload).eq('id', issueId);
    setBusy(button, false);
    if (error) return showToast(`Status belum berhasil disimpan: ${friendlyError(error)}`, 'error');
    showToast(`Status laporan diperbarui: ${ISSUE_STATUS_LABELS[status]}.`, 'success');
    await loadIssueReports({ silent: true });
  }
}

async function onGenerateReport(event) {
  event.preventDefault();
  hideMessage('#reportMessage');
  const periodId = $('#reportPeriod').value;
  const period = state.periods.find(item => item.id === periodId);
  if (!period) return showMessage('#reportMessage', 'Pilih periode yang valid.', 'error');
  const stages = state.stages.filter(stage => stage.periode_id === periodId).sort((a,b) => a.nomor_tahap - b.nomor_tahap);
  const button = event.submitter;
  setBusy(button, true, 'Menyusun PDF…');
  try {
    const stageIds = stages.map(stage => stage.id);
    let records = [];
    if (stageIds.length) {
      const { data, error } = await state.supabase.from('catatan_laundry').select('*').in('tahap_id', stageIds).order('santri_nama_snapshot');
      if (error) throw error;
      records = data || [];
    }
    await createMonthlyPdf(period, stages, records);
    showMessage('#reportMessage', 'PDF lanskap berhasil dibuat dan diunduh.', 'success');
    showToast('Laporan PDF berhasil dibuat.', 'success');
  } catch (error) {
    console.error(error);
    showMessage('#reportMessage', friendlyError(error), 'error');
  } finally {
    setBusy(button, false);
  }
}

function safePdfText(value) { return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim(); }
function addPdfLogo(doc, dataUrl, x, y, w, h, fallbackLabel) {
  if (dataUrl) {
    try {
      const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(dataUrl, format, x, y, w, h, undefined, 'FAST');
      return;
    } catch (error) { console.warn('Logo tidak dapat ditambahkan ke PDF', error); }
  }
  doc.setDrawColor(180,190,205); doc.setLineWidth(.35); doc.roundedRect(x,y,w,h,1.5,1.5,'S');
  doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(100,116,139);
  const lines = doc.splitTextToSize(fallbackLabel, w-3);
  doc.text(lines, x+w/2, y+h/2, {align:'center', baseline:'middle'});
}

async function createMonthlyPdf(period, stages, records) {
  const doc = new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const pageWidth = 297, pageHeight = 210, left = 10, right = 10;
  const settings = state.reportSettings || {};
  const dayahLogo = settings.logo_dayah_data || state.defaultDayahLogoData;
  const laundryLogo = settings.logo_laundry_data || null;
  const dayahName = safePdfText(settings.nama_dayah || 'Dayah Ruhul Qur’ani');
  const address = safePdfText(settings.alamat || '');
  const contact = safePdfText(settings.kontak || '');
  const reportTitle = safePdfText(settings.judul_laporan || 'REKAPITULASI LAUNDRY SANTRI');
  const stageById = new Map(stages.map(stage => [stage.id, Number(stage.nomor_tahap)]));
  const totalKg = records.reduce((sum,row) => sum + Number(row.berat_kg || 0), 0);
  const totalPieces = records.reduce((sum,row) => sum + (row.jumlah_pakaian === null ? 0 : Number(row.jumlah_pakaian || 0)), 0);
  const uniqueStudents = new Set(records.map(row => row.santri_id)).size;

  // Kop surat: logo laundry di kiri, identitas di tengah, logo dayah di kanan.
  addPdfLogo(doc, laundryLogo, 10, 7, 23, 23, 'LOGO\nLAUNDRY');
  addPdfLogo(doc, dayahLogo, 264, 7, 23, 23, 'LOGO\nDAYAH');
  doc.setTextColor(15,39,77); doc.setFont('helvetica','bold'); doc.setFontSize(12.5);
  doc.text(dayahName, pageWidth/2, 11, {align:'center', maxWidth:220});
  doc.setFont('helvetica','bold'); doc.setFontSize(10.5);
  doc.text(reportTitle, pageWidth/2, 17, {align:'center', maxWidth:220});
  doc.setFont('helvetica','normal'); doc.setFontSize(7.4); doc.setTextColor(71,85,105);
  let headerY = 22;
  if (address) { const addressLines = doc.splitTextToSize(address, 218); doc.text(addressLines, pageWidth/2, headerY, {align:'center'}); headerY += addressLines.length*3.3; }
  if (contact) { doc.text(contact, pageWidth/2, Math.min(headerY, 29), {align:'center', maxWidth:218}); }
  doc.setDrawColor(15,39,77); doc.setLineWidth(.8); doc.line(10,33,287,33);
  doc.setDrawColor(197,139,34); doc.setLineWidth(.35); doc.line(10,34.5,287,34.5);
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(15,39,77);
  doc.text(`PERIODE ${Number(period.nomor_periode)}`, pageWidth/2, 41, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(71,85,105);
  doc.text(`Santri tercatat: ${fmtInt.format(uniqueStudents)}   |   Total berat: ${fmt.format(totalKg)} kg   |   Total pakaian tercatat: ${fmtInt.format(totalPieces)}`, pageWidth/2, 46, {align:'center'});

  const levels = [...new Set(records.map(row => row.jenjang_nama_snapshot || 'Jenjang belum diisi'))].sort((a,b)=>a.localeCompare(b,'id'));
  let y = 53;
  if (!levels.length) {
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(71,85,105);
    doc.text('Belum ada catatan laundry pada periode ini.', left, y+5);
  }

  for (const level of levels) {
    if (y > 185) { doc.addPage('a4','landscape'); y = 15; }
    doc.setFillColor(232,240,252); doc.roundedRect(left,y, pageWidth-left-right,7,1.5,1.5,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(15,39,77);
    doc.text(`JENJANG: ${safePdfText(level).toLocaleUpperCase('id-ID')}`, left+3, y+4.8);
    y += 10;
    const levelRecords = records.filter(row => (row.jenjang_nama_snapshot || 'Jenjang belum diisi') === level);
    const rooms = [...new Set(levelRecords.map(row => row.kamar_nama_snapshot || 'Kamar belum diisi'))].sort((a,b)=>a.localeCompare(b,'id'));
    let levelKg = 0, levelPieces = 0;
    for (const room of rooms) {
      const roomRecords = levelRecords.filter(row => (row.kamar_nama_snapshot || 'Kamar belum diisi') === room);
      if (y > 178) { doc.addPage('a4','landscape'); y = 15; }
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(31,41,55);
      doc.text(`KAMAR: ${safePdfText(room)}`, left+1, y+2.5);
      y += 4;
      const students = new Map();
      for (const row of roomRecords) {
        const key = row.santri_id;
        if (!students.has(key)) students.set(key,{name:row.santri_nama_snapshot || 'Tanpa nama', stages:{}, kg:0, pieces:0, hasPieces:false});
        const item = students.get(key);
        const stageNo = stageById.get(row.tahap_id);
        if (stageNo) item.stages[stageNo] = (item.stages[stageNo] || 0) + Number(row.berat_kg || 0);
        item.kg += Number(row.berat_kg || 0);
        if (row.jumlah_pakaian !== null && row.jumlah_pakaian !== undefined) { item.pieces += Number(row.jumlah_pakaian || 0); item.hasPieces = true; }
      }
      const stageHeads = Array.from({length:8},(_,idx)=>`Tahap ${idx+1}`);
      const sortedStudents = [...students.values()].sort((a,b)=>a.name.localeCompare(b.name,'id'));
      const body = sortedStudents.map((student,index) => [String(index+1), student.name, ...Array.from({length:8},(_,idx)=>student.stages[idx+1] ? fmt.format(student.stages[idx+1]) : '—'), fmt.format(student.kg), student.hasPieces ? fmtInt.format(student.pieces) : '—']);
      const roomKg = roomRecords.reduce((sum,row)=>sum+Number(row.berat_kg||0),0);
      const roomPiecesKnown = roomRecords.some(row=>row.jumlah_pakaian !== null && row.jumlah_pakaian !== undefined);
      const roomPieces = roomRecords.reduce((sum,row)=>sum+(row.jumlah_pakaian===null||row.jumlah_pakaian===undefined?0:Number(row.jumlah_pakaian||0)),0);
      body.push(['','TOTAL KAMAR',...Array.from({length:8},(_,idx)=>fmt.format(roomRecords.filter(row=>stageById.get(row.tahap_id)===idx+1).reduce((sum,row)=>sum+Number(row.berat_kg||0),0))),fmt.format(roomKg),roomPiecesKnown?fmtInt.format(roomPieces):'—']);
      autoTable(doc, {
        startY:y+1, head:[['No','Nama santri',...stageHeads,'Total kg','Jml pakaian']], body,
        theme:'grid', margin:{left,right}, tableWidth:'auto',
        styles:{font:'helvetica',fontSize:6.7,cellPadding:1.7,overflow:'linebreak',textColor:[45,55,72],valign:'middle'},
        headStyles:{fillColor:[15,55,105],textColor:[255,255,255],fontStyle:'bold',halign:'center'},
        alternateRowStyles:{fillColor:[247,250,254]},
        columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:49},2:{cellWidth:14},3:{cellWidth:14},4:{cellWidth:14},5:{cellWidth:14},6:{cellWidth:14},7:{cellWidth:14},8:{cellWidth:14},9:{cellWidth:14},10:{cellWidth:17,halign:'right'},11:{cellWidth:17,halign:'right'}},
        didParseCell:(data)=>{if(data.section==='body' && data.row.index===body.length-1){data.cell.styles.fontStyle='bold';data.cell.styles.fillColor=[229,238,250];}}
      });
      y = (doc.lastAutoTable?.finalY || y+20) + 5;
      levelKg += roomKg; levelPieces += roomPieces;
      if (y > 184 && room !== rooms[rooms.length-1]) { doc.addPage('a4','landscape'); y = 15; }
    }
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(15,39,77);
    doc.text(`TOTAL JENJANG ${safePdfText(level)}: ${fmt.format(levelKg)} kg  |  ${fmtInt.format(levelPieces)} pakaian tercatat`, left+1, Math.min(y+1,195));
    y = Math.min(y+8,198);
  }

  const pageCount = doc.getNumberOfPages();
  for (let page=1; page<=pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(203,213,225); doc.setLineWidth(.25); doc.line(10,pageHeight-9,287,pageHeight-9);
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(100,116,139);
    doc.text(`SILAS · ${periodLabel(period)}`,10,pageHeight-4);
    doc.text(`Halaman ${page} dari ${pageCount}`,287,pageHeight-4,{align:'right'});
  }
  doc.save(`SILAS-Laporan-${Number(period.nomor_periode)}.pdf`);
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Gagal memuat gambar.');
  const blob = await response.blob();
  return await new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadReportSettings() {
  const { data, error } = await state.supabase.from('pengaturan_laporan').select('*').eq('id',1).maybeSingle();
  if (error) {
    console.warn('Pengaturan laporan belum tersedia. Jalankan sql/03_periode_dan_pengaturan.sql.', error);
    renderReportSettingsForm();
    return;
  }
  if (data) state.reportSettings = {...state.reportSettings, ...data};
  renderReportSettingsForm();
}

function renderReportSettingsForm() {
  const settings = state.reportSettings;
  if (!$('#settingDayahName')) return;
  $('#settingDayahName').value = settings.nama_dayah || 'Dayah Ruhul Qur’ani';
  $('#settingAddress').value = settings.alamat || '';
  $('#settingContact').value = settings.kontak || '';
  $('#settingReportTitle').value = settings.judul_laporan || 'REKAPITULASI LAUNDRY SANTRI';
  $('#settingDirectorName').value = settings.nama_direktur || '';
  $('#settingDirectorRole').value = settings.jabatan_direktur || 'Direktur Badan Usaha Dayah Ruhul Qur’ani';
  $('#settingDirectorQuote').value = settings.kata_direktur || 'Kebersihan dan kerapian adalah bagian dari pelayanan. Semoga setiap ikhtiar memudahkan santri dalam menuntut ilmu.';
  renderReportLogoPreviews();
  renderDirectorPhotoPreview();
  renderDirectorCard();
  updateReportSettingsPreview();
}

function directorPlaceholderMarkup(label = 'Foto direktur ditambahkan melalui Pengaturan') {
  return `<div class="director-photo-placeholder"><span>DRQ</span><small>${escapeHtml(label)}</small></div>`;
}

function renderDirectorPhotoPreview() {
  const container = $('#directorPhotoPreview');
  if (!container) return;
  container.innerHTML = state.reportSettings.foto_direktur_data
    ? `<img src="${state.reportSettings.foto_direktur_data}" alt="Pratinjau foto direktur">`
    : directorPlaceholderMarkup('Unggah foto direktur');
}

function renderDirectorCard() {
  const photo = $('#directorDashboardPhoto');
  if (!photo) return;
  const settings = state.reportSettings || {};
  photo.innerHTML = settings.foto_direktur_data
    ? `<img src="${settings.foto_direktur_data}" alt="Foto ${escapeHtml(settings.nama_direktur || 'Direktur')}" loading="lazy">`
    : directorPlaceholderMarkup('Foto resmi dapat ditambahkan melalui Pengaturan');
  $('#directorDashboardName').textContent = settings.nama_direktur?.trim() || 'Nama Direktur';
  $('#directorDashboardRole').textContent = settings.jabatan_direktur?.trim() || 'Direktur Badan Usaha Dayah Ruhul Qur’ani';
  $('#directorDashboardQuote').textContent = settings.kata_direktur?.trim() || 'Kebersihan dan kerapian adalah bagian dari pelayanan. Semoga setiap ikhtiar memudahkan santri dalam menuntut ilmu.';
}

async function onDirectorPhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
    showToast('Gunakan foto PNG, JPG, atau WebP.', 'error'); event.target.value = ''; return;
  }
  if (file.size > 1024 * 1024) {
    showToast('Ukuran foto maksimal 1 MB agar pengaturan tetap ringan.', 'error'); event.target.value = ''; return;
  }
  try {
    state.reportSettings.foto_direktur_data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    renderDirectorPhotoPreview();
    renderDirectorCard();
  } catch (error) {
    showToast('Foto tidak dapat dibaca. Coba pilih file lain.', 'error');
  }
}

function renderLogoPreview(containerId, dataUrl, placeholder, defaultData = null) {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.replaceChildren();
  const data = dataUrl || defaultData;
  if (data) {
    const img = document.createElement('img'); img.src = data; img.alt = placeholder; container.append(img);
  } else {
    const span = document.createElement('span'); span.textContent = placeholder; container.append(span);
  }
}

function renderReportLogoPreviews() {
  renderLogoPreview('laundryLogoPreview', state.reportSettings.logo_laundry_data, 'Logo Laundry BUD_RQ');
  renderLogoPreview('dayahLogoPreview', state.reportSettings.logo_dayah_data, 'Logo Dayah', state.defaultDayahLogoData);
  renderLogoPreview('previewLaundryLogo', state.reportSettings.logo_laundry_data, 'Logo Laundry');
  renderLogoPreview('previewDayahLogo', state.reportSettings.logo_dayah_data, 'Logo Dayah', state.defaultDayahLogoData);
  const hero = $('#heroLaundryLogo');
  if (hero) {
    hero.replaceChildren();
    if (state.reportSettings.logo_laundry_data) {
      const img=document.createElement('img'); img.src=state.reportSettings.logo_laundry_data; img.alt='Logo Laundry BUD_RQ'; img.className='hero-uploaded-laundry-logo'; hero.append(img);
    } else {
      const icon=document.createElement('span'); icon.className='laundry-placeholder-icon'; icon.textContent='♧'; hero.append(icon);
      const copy=document.createElement('div'); copy.innerHTML='<strong>Logo Laundry BUD_RQ</strong><small>Tambahkan melalui Pengaturan Laporan</small>'; hero.append(copy);
    }
  }
  updateReportSettingsPreview();
}

function updateReportSettingsPreview() {
  if (!$('#previewDayahName')) return;
  $('#previewDayahName').textContent = ($('#settingDayahName').value || 'Nama Dayah').toLocaleUpperCase('id-ID');
  $('#previewAddress').textContent = $('#settingAddress').value.trim() || 'Alamat dayah akan tampil di sini';
  $('#previewContact').textContent = $('#settingContact').value.trim() || 'Kontak / identitas tambahan';
  $('#previewReportTitle').textContent = ($('#settingReportTitle').value || 'Judul laporan').toLocaleUpperCase('id-ID');
}

async function onLogoFileChange(event, property) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/png','image/jpeg'].includes(file.type)) { showToast('Gunakan file logo PNG atau JPG.', 'error'); event.target.value=''; return; }
  if (file.size > 1024*1024) { showToast('Ukuran logo maksimal 1 MB.', 'error'); event.target.value=''; return; }
  try {
    state.reportSettings[property] = await new Promise((resolve,reject) => {
      const reader = new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file);
    });
    renderReportLogoPreviews();
  } catch (error) { showToast('Gagal membaca file logo.', 'error'); }
}

async function onSaveReportSettings(event) {
  event.preventDefault();
  hideMessage('#reportSettingsMessage');
  const payload = {
    id:1,
    nama_dayah:$('#settingDayahName').value.trim(),
    alamat:$('#settingAddress').value.trim(),
    kontak:$('#settingContact').value.trim(),
    judul_laporan:$('#settingReportTitle').value.trim(),
    logo_dayah_data:state.reportSettings.logo_dayah_data || null,
    logo_laundry_data:state.reportSettings.logo_laundry_data || null,
    nama_direktur:$('#settingDirectorName').value.trim(),
    jabatan_direktur:$('#settingDirectorRole').value.trim() || 'Direktur Badan Usaha Dayah Ruhul Qur’ani',
    kata_direktur:$('#settingDirectorQuote').value.trim(),
    foto_direktur_data:state.reportSettings.foto_direktur_data || null,
    updated_at:new Date().toISOString()
  };
  if (!payload.nama_dayah || !payload.judul_laporan) return showMessage('#reportSettingsMessage','Nama dayah dan judul laporan wajib diisi.','error');
  const button = event.submitter || $('#saveReportSettingsBtn'); setBusy(button,true,'Menyimpan…');
  const {data,error} = await state.supabase.from('pengaturan_laporan').upsert(payload,{onConflict:'id'}).select().single();
  setBusy(button,false);
  if (error) return showMessage('#reportSettingsMessage',`${friendlyError(error)}. Pastikan script sql/03_periode_dan_pengaturan.sql sudah dijalankan.`, 'error');
  state.reportSettings = {...state.reportSettings,...data};
  renderReportSettingsForm();
  showMessage('#reportSettingsMessage','Pengaturan kop surat berhasil disimpan dan akan digunakan pada PDF berikutnya.','success');
  showToast('Pengaturan laporan disimpan.','success');
}

function resetReportSettingsForm() {
  state.reportSettings = {id:1,nama_dayah:'Dayah Ruhul Qur’ani',alamat:'',kontak:'',judul_laporan:'REKAPITULASI LAUNDRY SANTRI',logo_dayah_data:null,logo_laundry_data:null,nama_direktur:'',jabatan_direktur:'Direktur Badan Usaha Dayah Ruhul Qur’ani',kata_direktur:'Kebersihan dan kerapian adalah bagian dari pelayanan. Semoga setiap ikhtiar memudahkan santri dalam menuntut ilmu.',foto_direktur_data:null};
  $('#laundryLogoFile').value=''; $('#dayahLogoFile').value=''; $('#directorPhotoFile').value='';
  renderReportSettingsForm();
  showMessage('#reportSettingsMessage','Nilai default dipulihkan di formulir. Klik Simpan untuk menerapkannya ke laporan.','info');
}

if (!configured) {
  $('#configWarning').classList.remove('hidden');
  $('#authScreen').classList.add('hidden');
  $('#appShell').classList.add('hidden');
} else {
  start();
}
