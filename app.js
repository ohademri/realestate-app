
  const STORAGE_KEY = 'appraiser_form_data';

  // --- Auto-save: collect all form values into an object ---
  function collectFormState() {
    const state = {};
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.id) return;
      if (el.type === 'checkbox') state[el.id] = el.checked;
      else state[el.id] = el.value;
    });
    return state;
  }

  // --- Auto-save: restore form values from saved state ---
  function restoreFormState(state) {
    if (!state) return;
    Object.entries(state).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val;
    });
  }

  // --- Save to localStorage with debounce ---
  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collectFormState()));
        updateSaveIndicator('נשמר');
      } catch(e) { /* storage full or unavailable */ }
    }, 400);
  }

  // --- Save indicator ---
  function updateSaveIndicator(text) {
    const ind = document.getElementById('saveIndicator');
    if (!ind) return;
    ind.textContent = text;
    ind.classList.add('visible');
    setTimeout(() => ind.classList.remove('visible'), 2000);
  }

  // --- Load saved data on page open ---
  function loadSavedData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        restoreFormState(state);
        return true;
      }
    } catch(e) { /* parse error, ignore */ }
    return false;
  }


  function bindCrossPlatformControls() {
    document.querySelectorAll('[data-section-target]').forEach(btn => {
      const toggle = () => {
        const id = btn.getAttribute('data-section-target');
        toggleSection(id);
        const section = document.getElementById(id);
        btn.setAttribute('aria-expanded', section && !section.classList.contains('collapsed') ? 'true' : 'false');
      };
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
      });
    });

    document.querySelectorAll('[data-step-target]').forEach(btn => {
      const run = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        stepInput(btn.getAttribute('data-step-target'), Number(btn.getAttribute('data-step-delta')) || 1);
      };
      if (window.PointerEvent) btn.addEventListener('pointerup', run);
      else {
        btn.addEventListener('touchend', run, { passive: false });
        btn.addEventListener('click', run);
      }
    });

    const buildingType = document.getElementById('buildingType');
    if (buildingType) buildingType.addEventListener('change', toggleBuildingTypeOther);
    const downloadHtmlBtn = document.getElementById('downloadHtmlBtn');
    if (downloadHtmlBtn) downloadHtmlBtn.addEventListener('click', downloadForm);
    const downloadWordBtn = document.getElementById('downloadWordBtn');
    if (downloadWordBtn) downloadWordBtn.addEventListener('click', downloadWord);
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
    const clearBtn = document.getElementById('clearFormBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearForm);

    document.querySelectorAll('input[data-numeric]').forEach(el => {
      el.addEventListener('input', () => {
        const cleaned = el.value.replace(/[^0-9.]/g, '');
        if (cleaned !== el.value) el.value = cleaned;
      });
    });
  }

  // --- Date display formatting ---
  function formatDateDisplay(isoValue) {
    if (!isoValue) return 'בחר תאריך';
    const [y, m, d] = isoValue.split('-');
    return `${parseInt(d)}/${parseInt(m)}/${y}`;
  }

  function syncDateDisplay() {
    const dateInput = document.getElementById('visitDate');
    const dateDisplay = document.getElementById('visitDateDisplay');
    if (!dateInput || !dateDisplay) return;
    dateDisplay.textContent = formatDateDisplay(dateInput.value);
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // --- Init ---
  const hadSavedData = loadSavedData();
  if (!hadSavedData) {
    document.getElementById('visitDate').valueAsDate = new Date();
  }
  syncDateDisplay();
  document.getElementById('visitDate').addEventListener('change', syncDateDisplay);
  toggleBuildingTypeOther();
  bindCrossPlatformControls();

  // Listen to all form changes
  document.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', scheduleSave);
    el.addEventListener('change', scheduleSave);
  });

  function stepInput(id, delta) {
    const el = document.getElementById(id);
    const min = el.min !== '' ? parseFloat(el.min) : -Infinity;
    const max = el.max !== '' ? parseFloat(el.max) : Infinity;
    const step = el.step !== '' && el.step !== 'any' ? parseFloat(el.step) : 1;
    const cur = el.value !== '' ? parseFloat(el.value) : (delta > 0 ? (isFinite(min) ? min : 0) : (isFinite(max) ? max : 0));
    const next = Math.min(max, Math.max(min, cur + delta * step));
    el.value = next;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function toggleSection(id) {
    document.getElementById(id).classList.toggle('collapsed');
  }

  function toggleBuildingTypeOther() {
    const sel = document.getElementById('buildingType');
    const other = document.getElementById('buildingTypeOther');
    other.style.display = sel.value === 'אחר' ? 'block' : 'none';
    if (sel.value !== 'אחר') other.value = '';
    scheduleSave();
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  function gatherData() {
    const g = (id) => {
      const el = document.getElementById(id);
      if (!el) return '';
      if (el.type === 'checkbox') return el.checked;
      return el.value || '';
    };

    const directions = [];
    if (document.getElementById('dirEast').checked) directions.push('מזרח');
    if (document.getElementById('dirNorth').checked) directions.push('צפון');
    if (document.getElementById('dirWest').checked) directions.push('מערב');
    if (document.getElementById('dirSouth').checked) directions.push('דרום');

    return {
      meta: { appraiserName: g('appraiserName'), visitDate: g('visitDate'), reportNumber: g('reportNumber') },
      building: {
        buildingType: g('buildingType') === 'אחר' ? (g('buildingTypeOther') || 'אחר') : g('buildingType'), buildingAge: g('buildingAge'), totalFloors: g('totalFloors'),
        aboveFloors: g('aboveFloors'), belowFloors: g('belowFloors'),
        elevatorExists: g('elevatorExists'), elevatorCount: g('elevatorCount'),
        entranceCount: g('entranceCount'), unitsInBuilding: g('unitsInBuilding'),
        unitsPerFloor: g('unitsPerFloor'), unitsPerEntrance: g('unitsPerEntrance'),
        buildingCondition: g('buildingCondition'), buildingNotes: g('buildingNotes')
      },
      apartment: {
        levelCount: g('levelCount'), roomCount: g('roomCount'), entranceNumber: g('entranceNumber'),
        apartmentLayout: g('apartmentLayout'), kitchenDesc: g('kitchenDesc'),
        bathroomDesc: g('bathroomDesc'), windowsDesc: g('windowsDesc'), doorsDesc: g('doorsDesc'),
        acDesc: g('acDesc'), flooringDesc: g('flooringDesc'),
        innerHeight: g('innerHeight'), apartmentFloor: g('apartmentFloor')
      },
      usage: {
        propertyUse: g('propertyUse'), apartmentPosition: g('apartmentPosition'),
        directions: directions.join(', '), levelType: g('levelType'), usageNotes: g('usageNotes')
      },
      condition: {
        physicalCondition: g('physicalCondition'), maintenanceCondition: g('maintenanceCondition'),
        conditionNotes: g('conditionNotes')
      },
      general: {
        generalNotes: g('generalNotes')
      }
    };
  }

  async function downloadForm() {
    const d = gatherData();
    const v = (val) => val || '—';

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><title>דוח שמאי — ${v(d.meta.reportNumber)}<\/title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Heebo',sans-serif;color:#2c2a26;padding:40px;max-width:800px;margin:0 auto;line-height:1.7;font-size:14px}
  h1{font-size:24px;color:#1e3456;border-bottom:3px solid #c9a84c;padding-bottom:8px;margin-bottom:6px}
  .sub{font-size:13px;color:#6b665c;margin-bottom:28px}
  h2{font-size:17px;background:#e8edf4;color:#1e3456;padding:8px 16px;border-radius:6px;margin:24px 0 14px;border-right:3px solid #c9a84c}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  td{padding:7px 12px;border-bottom:1px solid #e8e4dc;vertical-align:top}
  td:first-child{font-weight:600;color:#6b665c;width:38%;white-space:nowrap}
  td:last-child{color:#2c2a26}
  .notes{background:#faf9f7;padding:10px 14px;border-radius:6px;border:1px solid #e8e4dc;margin-top:4px;font-size:13px;white-space:pre-wrap}
  .footer{margin-top:40px;padding-top:16px;border-top:2px solid #e8e4dc;text-align:center;font-size:12px;color:#9e9889}
  .doc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
  .doc-header img{width:80px;height:80px;object-fit:contain}
  @media print{body{padding:20px}h2{background:#f0f0f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
<\/style><\/head><body>
<div class="doc-header"><h1>🏠 דוח ביקור שמאי<\/h1><img src="footer-logo.jpg" alt="רבר פישמן"><\/div>
<div class="sub">${v(d.meta.appraiserName)} &nbsp;|&nbsp; ${v(d.meta.visitDate)} &nbsp;|&nbsp; דוח: ${v(d.meta.reportNumber)}<\/div>

<h2>🏢 תיאור הבניין<\/h2>
<table>
<tr><td>סוג הבניין<\/td><td>${v(d.building.buildingType)}<\/td><\/tr>
<tr><td>גיל הבניין<\/td><td>${v(d.building.buildingAge)} שנים<\/td><\/tr>
<tr><td>קומות (מעל / מתחת)<\/td><td>${v(d.building.aboveFloors)} / ${v(d.building.belowFloors)} (סה״כ ${v(d.building.totalFloors)})<\/td><\/tr>
<tr><td>מעלית<\/td><td>${v(d.building.elevatorExists)}${d.building.elevatorCount ? ' (' + d.building.elevatorCount + ')' : ''}<\/td><\/tr>
<tr><td>מס׳ כניסות<\/td><td>${v(d.building.entranceCount)}<\/td><\/tr>
<tr><td>יחידות בבניין / בקומה / בכניסה<\/td><td>${v(d.building.unitsInBuilding)} / ${v(d.building.unitsPerFloor)} / ${v(d.building.unitsPerEntrance)}<\/td><\/tr>
<tr><td>מצב פיזי<\/td><td>${v(d.building.buildingCondition)}<\/td><\/tr>
<\/table>
${d.building.buildingNotes ? '<div class="notes">' + d.building.buildingNotes + '<\/div>' : ''}

<h2>🚪 תיאור הדירה<\/h2>
<table>
<tr><td>מס׳ חדרים<\/td><td>${v(d.apartment.roomCount)}<\/td><\/tr>
<tr><td>מס׳ מפלסים<\/td><td>${v(d.apartment.levelCount)}<\/td><\/tr>
<tr><td>קומה<\/td><td>${v(d.apartment.apartmentFloor)}<\/td><\/tr>
<tr><td>כניסה<\/td><td>${v(d.apartment.entranceNumber)}<\/td><\/tr>
<tr><td>גובה פנימי<\/td><td>${d.apartment.innerHeight ? d.apartment.innerHeight + ' מ׳' : '—'}<\/td><\/tr>
<tr><td>חלוקה<\/td><td>${v(d.apartment.apartmentLayout)}<\/td><\/tr>
<tr><td>מטבח<\/td><td>${v(d.apartment.kitchenDesc)}<\/td><\/tr>
<tr><td>חדר רחצה<\/td><td>${v(d.apartment.bathroomDesc)}<\/td><\/tr>
<tr><td>חלונות<\/td><td>${v(d.apartment.windowsDesc)}<\/td><\/tr>
<tr><td>דלתות<\/td><td>${v(d.apartment.doorsDesc)}<\/td><\/tr>
<tr><td>מזגנים<\/td><td>${v(d.apartment.acDesc)}<\/td><\/tr>
<tr><td>ריצוף<\/td><td>${v(d.apartment.flooringDesc)}<\/td><\/tr>
<\/table>

<h2>📍 שימוש ומיקום<\/h2>
<table>
<tr><td>שימוש בנכס<\/td><td>${v(d.usage.propertyUse)}<\/td><\/tr>
<tr><td>מיקום הדירה<\/td><td>${v(d.usage.apartmentPosition)}<\/td><\/tr>
<tr><td>כיווני אוויר<\/td><td>${v(d.usage.directions)}<\/td><\/tr>
<tr><td>מפלס<\/td><td>${v(d.usage.levelType)}<\/td><\/tr>
<\/table>
${d.usage.usageNotes ? '<div class="notes">' + d.usage.usageNotes + '<\/div>' : ''}

<h2>🔧 מצב פיזי ותחזוקתי<\/h2>
<table>
<tr><td>מצב פיזי<\/td><td>${v(d.condition.physicalCondition)}<\/td><\/tr>
<tr><td>מצב תחזוקתי<\/td><td>${v(d.condition.maintenanceCondition)}<\/td><\/tr>
<\/table>
${d.condition.conditionNotes ? '<div class="notes">' + d.condition.conditionNotes + '<\/div>' : ''}

${d.general.generalNotes ? '<h2>📝 הערות כלליות<\/h2><div class="notes">' + d.general.generalNotes + '<\/div>' : ''}

<div style="text-align:center;margin-top:30px;margin-bottom:10px"><img src="footer-logo.jpg" alt="רבר פישמן" style="width:100%;max-width:700px;height:auto"><\/div>
<div class="footer">טופס זה הופק באופן דיגיטלי &nbsp;•&nbsp; ${new Date().toLocaleDateString('he-IL')}<\/div>
<\/body><\/html>`;

    const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const htmlFileName = 'דוח_שמאי_' + (d.meta.reportNumber || new Date().toISOString().slice(0,10)) + '.html';
    await saveOrShareBlob(htmlBlob, htmlFileName, 'text/html', '✓ הקובץ מוכן');
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async function saveOrShareBlob(blob, fileName, mimeType, successMessage) {
    let file;
    try { file = new File([blob], fileName, { type: mimeType }); } catch(e) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        showToast(successMessage || '✓ הקובץ שותף בהצלחה');
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    showToast(successMessage || '✓ הקובץ הורד בהצלחה');
  }


  async function downloadWord() {
    const d = gatherData();
    const v = (val) => val || '—';
    const nl = (val) => val ? val.replace(/\n/g, '<br>') : '—';

    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print<\/w:View><w:Zoom>100<\/w:Zoom><w:DoNotOptimizeForBrowser/><\/w:WordDocument><\/xml><![endif]-->
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Arial, sans-serif; color: #222; direction: rtl; font-size: 12pt; line-height: 1.6; }
  h1 { font-size: 22pt; color: #1e3456; border-bottom: 3px solid #c9a84c; padding-bottom: 6px; margin-bottom: 4px; }
  .sub { font-size: 10pt; color: #666; margin-bottom: 20px; }
  h2 { font-size: 14pt; color: #1e3456; background: #e8edf4; padding: 6px 14px; margin: 20px 0 12px; border-right: 3px solid #c9a84c; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td { padding: 6px 10px; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 11pt; }
  td:first-child { font-weight: bold; color: #555; width: 35%; }
  .notes { background: #f7f7f5; padding: 8px 12px; border: 1px solid #ddd; margin-top: 4px; font-size: 10pt; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 2px solid #ddd; text-align: center; font-size: 9pt; color: #999; }
  .doc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .doc-header img { width: 80px; height: 80px; object-fit: contain; }
<\/style>
<\/head>
<body dir="rtl">
<div class="doc-header"><h1>דוח ביקור שמאי<\/h1><img src="footer-logo.jpg" alt="רבר פישמן"><\/div>
<div class="sub">${v(d.meta.appraiserName)} &nbsp;|&nbsp; ${v(d.meta.visitDate)} &nbsp;|&nbsp; דוח: ${v(d.meta.reportNumber)}<\/div>

<h2>תיאור הבניין<\/h2>
<table>
<tr><td>סוג הבניין<\/td><td>${v(d.building.buildingType)}<\/td><\/tr>
<tr><td>גיל הבניין<\/td><td>${v(d.building.buildingAge)} שנים<\/td><\/tr>
<tr><td>קומות מעל קרקע<\/td><td>${v(d.building.aboveFloors)}<\/td><\/tr>
<tr><td>קומות מתחת לקרקע<\/td><td>${v(d.building.belowFloors)}<\/td><\/tr>
<tr><td>סה״כ קומות<\/td><td>${v(d.building.totalFloors)}<\/td><\/tr>
<tr><td>מעלית<\/td><td>${v(d.building.elevatorExists)}${d.building.elevatorCount ? ' (' + d.building.elevatorCount + ' מעליות)' : ''}<\/td><\/tr>
<tr><td>מס׳ כניסות<\/td><td>${v(d.building.entranceCount)}<\/td><\/tr>
<tr><td>יחידות בבניין<\/td><td>${v(d.building.unitsInBuilding)}<\/td><\/tr>
<tr><td>יחידות בקומה<\/td><td>${v(d.building.unitsPerFloor)}<\/td><\/tr>
<tr><td>יחידות בכניסה<\/td><td>${v(d.building.unitsPerEntrance)}<\/td><\/tr>
<tr><td>מצב פיזי<\/td><td>${v(d.building.buildingCondition)}<\/td><\/tr>
<\/table>
${d.building.buildingNotes ? '<div class="notes">' + nl(d.building.buildingNotes) + '<\/div>' : ''}

<h2>תיאור הדירה<\/h2>
<table>
<tr><td>מס׳ חדרים<\/td><td>${v(d.apartment.roomCount)}<\/td><\/tr>
<tr><td>מס׳ מפלסים<\/td><td>${v(d.apartment.levelCount)}<\/td><\/tr>
<tr><td>קומת הדירה<\/td><td>${v(d.apartment.apartmentFloor)}<\/td><\/tr>
<tr><td>מס׳ כניסה<\/td><td>${v(d.apartment.entranceNumber)}<\/td><\/tr>
<tr><td>גובה פנימי<\/td><td>${d.apartment.innerHeight ? d.apartment.innerHeight + ' מ׳' : '—'}<\/td><\/tr>
<tr><td>חלוקה<\/td><td>${nl(d.apartment.apartmentLayout)}<\/td><\/tr>
<tr><td>מטבח<\/td><td>${nl(d.apartment.kitchenDesc)}<\/td><\/tr>
<tr><td>חדר רחצה<\/td><td>${nl(d.apartment.bathroomDesc)}<\/td><\/tr>
<tr><td>חלונות<\/td><td>${nl(d.apartment.windowsDesc)}<\/td><\/tr>
<tr><td>דלתות<\/td><td>${nl(d.apartment.doorsDesc)}<\/td><\/tr>
<tr><td>מזגנים<\/td><td>${nl(d.apartment.acDesc)}<\/td><\/tr>
<tr><td>ריצוף<\/td><td>${nl(d.apartment.flooringDesc)}<\/td><\/tr>
<\/table>

<h2>שימוש ומיקום<\/h2>
<table>
<tr><td>שימוש בנכס<\/td><td>${v(d.usage.propertyUse)}<\/td><\/tr>
<tr><td>מיקום הדירה<\/td><td>${v(d.usage.apartmentPosition)}<\/td><\/tr>
<tr><td>כיווני אוויר<\/td><td>${v(d.usage.directions)}<\/td><\/tr>
<tr><td>מפלס<\/td><td>${v(d.usage.levelType)}<\/td><\/tr>
<\/table>
${d.usage.usageNotes ? '<div class="notes">' + nl(d.usage.usageNotes) + '<\/div>' : ''}

<h2>מצב פיזי ותחזוקתי<\/h2>
<table>
<tr><td>מצב פיזי<\/td><td>${v(d.condition.physicalCondition)}<\/td><\/tr>
<tr><td>מצב תחזוקתי<\/td><td>${v(d.condition.maintenanceCondition)}<\/td><\/tr>
<\/table>
${d.condition.conditionNotes ? '<div class="notes">' + nl(d.condition.conditionNotes) + '<\/div>' : ''}

${d.general.generalNotes ? '<h2>הערות כלליות<\/h2><div class="notes">' + nl(d.general.generalNotes) + '<\/div>' : ''}

<div style="text-align:center;margin-top:30px;margin-bottom:10px"><img src="footer-logo.jpg" alt="רבר פישמן" style="width:100%;max-width:700px;height:auto"><\/div>
<div class="footer">טופס זה הופק באופן דיגיטלי | ${new Date().toLocaleDateString('he-IL')}<\/div>
<\/body><\/html>`;

    const wordFileName = 'דוח_שמאי_' + (d.meta.reportNumber || new Date().toISOString().slice(0,10)) + '.doc';
    const wordBlob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
    await saveOrShareBlob(wordBlob, wordFileName, 'application/msword', '✓ קובץ Word מוכן');
  }

  function clearForm() {
    if (!confirm('האם למחוק את כל הנתונים שהוזנו? פעולה זו תמחק גם את הנתונים השמורים.')) return;
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else if (el.type === 'date') el.valueAsDate = new Date();
      else el.value = '';
    });
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    showToast('הטופס נוקה והנתונים נמחקו');
  }
