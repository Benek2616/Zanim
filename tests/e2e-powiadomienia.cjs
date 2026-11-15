// Test E2E (Playwright) powiadomień. Uruchom: npm run build && PORT=8847 node .output/server/index.mjs
// a w drugim terminalu: BASE=http://127.0.0.1:8847 VAPID_PUBLIC_KEY=... CHROME_PATH=/ścieżka/do/chrome node tests/e2e-powiadomienia.cjs
const { chromium } = (() => { try { return require('playwright-core'); } catch { return require('/node_modules/playwright-core'); } })();
const fs = require('fs');
const B = process.env.BASE || 'http://127.0.0.1:8847';
const PUB = process.env.VAPID_PUBLIC_KEY;
const H = 3600e3;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✔', m); } else { fail++; console.log('  ✘', m); } };
const now = Date.now(), iso = t => new Date(t).toISOString();
const item = (id, title, ageH, status = 'waiting', extra = {}) => ({ id, title, amountGrosze: 64900, category: 'elektronika', note: '', waitHours: 48, createdAt: iso(now - ageH * H), readyAt: iso(now - ageH * H + 48 * H), status, ...extra });
const state = items => JSON.stringify({ state: { onboardingDone: true, darkMode: false, items, profile: { displayName: '', email: '', accountCreated: false, monthlyIncomeGrosze: null, monthlyHours: 160, savingsGoalGrosze: null }, entitlements: { plan: 'free', plus: false, periodEnd: null, cancelAtPeriodEnd: false }, review: null }, version: 0 });

async function ctxWith(b, items, { grant = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pl-PL', timezoneId: 'Europe/Warsaw' });
  if (grant) await ctx.grantPermissions(['notifications'], { origin: B });
  const calls = [];
  await ctx.route(/\/api\/track-/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await ctx.route(/\/api\/push\/config/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, configured: true, publicKey: PUB }) }));
  await ctx.route(/\/api\/push\/(subscribe|prefs|sync|unsubscribe)/, async r => {
    const body = JSON.parse(r.request().postData() || '{}');
    calls.push({ path: new URL(r.request().url()).pathname, body });
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, prefs: body.prefs }) });
  });
  await ctx.addInitScript(([s]) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.setItem('zanim.v1', s); sessionStorage.setItem('seeded', '1'); }
    // Headless Chromium nie ma usługi push (FCM) → atrapa subskrypcji
    const fake = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint', options: { applicationServerKey: null },
      toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'BPtestp256dh', auth: 'testauth' } }; }, unsubscribe: async () => { localStorage.removeItem('fake.sub'); return true; } };
    if (window.PushManager) {
      PushManager.prototype.subscribe = async function (opts) { localStorage.setItem('fake.sub', '1'); fake.options.applicationServerKey = opts.applicationServerKey; return fake; };
      PushManager.prototype.getSubscription = async function () { return localStorage.getItem('fake.sub') ? fake : null; };
    }
  }, [state(items)]);
  return { ctx, calls };
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  fs.mkdirSync('shots', { recursive: true });

  console.log('1. Ustawienia: render + trwałość przełączników');
  { const { ctx, calls } = await ctxWith(b, []); const p = await ctx.newPage();
    await p.goto(B + '/powiadomienia', { waitUntil: 'networkidle' });
    ok(await p.getByRole('heading', { name: 'Powiadomienia' }).isVisible(), 'nagłówek Powiadomienia');
    for (const t of ['automatic', 'motivational', 'marketing']) ok(await p.getByTestId('toggle-' + t).isVisible(), 'przełącznik ' + t);
    ok(await p.getByTestId('toggle-automatic').getAttribute('aria-checked') === 'true', 'Automatyczne domyślnie ON');
    ok(await p.getByTestId('toggle-motivational').getAttribute('aria-checked') === 'true', 'Motywacyjne domyślnie ON');
    ok(await p.getByTestId('toggle-marketing').getAttribute('aria-checked') === 'false', 'Marketingowe domyślnie OFF (opt-in)');
    ok(await p.getByTestId('quiet-start').inputValue() === '21' && await p.getByTestId('quiet-end').inputValue() === '9', 'cisza nocna 21:00–9:00');
    await p.screenshot({ path: 'shots/ustawienia.png', fullPage: true });
    await p.getByTestId('toggle-marketing').click(); await p.getByTestId('toggle-motivational').click();
    await p.getByTestId('quiet-start').selectOption('22');
    await p.reload({ waitUntil: 'networkidle' });
    ok(await p.getByTestId('toggle-marketing').getAttribute('aria-checked') === 'true', 'po przeładowaniu: Marketingowe ON');
    ok(await p.getByTestId('toggle-motivational').getAttribute('aria-checked') === 'false', 'po przeładowaniu: Motywacyjne OFF');
    ok(await p.getByTestId('quiet-start').inputValue() === '22', 'po przeładowaniu: cisza od 22:00');
    ok(calls.length === 0, 'bez włączonych powiadomień nic nie idzie na serwer');
    await ctx.close(); }

  console.log('2. Brak prośby przy pierwszym uruchomieniu (pusta poczekalnia)');
  { const { ctx } = await ctxWith(b, [], { grant: false }); const p = await ctx.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    ok(await p.getByTestId('push-prompt').count() === 0, 'brak karty zgody bez rzeczy w poczekalni');
    await ctx.close(); }

  console.log('3. Kontekstowa prośba po dodaniu rzeczy + zgoda (mock granted) + subskrypcja + sync');
  { const items = [item('it-1', 'Słuchawki nauszne', 50), item('it-2', 'Kurtka', 10), item('it-3', 'AirPods', 100, 'skipped', { verdictAt: iso(now - 2 * H), skipReason: 'emocje' })];
    const { ctx, calls } = await ctxWith(b, items, { grant: true }); const p = await ctx.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' });
    // przy granted karta nie powinna się pokazać (zgoda już jest) — sprawdzamy wariant "default" w kroku 4
    await p.goto(B + '/powiadomienia', { waitUntil: 'networkidle' });
    await p.getByTestId('push-enable').click();
    await p.waitForTimeout(1500);
    const sub = calls.find(c => c.path === '/api/push/subscribe');
    ok(!!sub, 'POST /api/push/subscribe');
    ok(sub && /^[A-Za-z0-9_-]{16,64}$/.test(sub.body.deviceId) && sub.body.secret.length >= 32, 'deviceId + sekret urządzenia');
    ok(sub && sub.body.subscription.endpoint.includes('fcm') && sub.body.subscription.keys.p256dh, 'subskrypcja z endpointem i kluczami');
    ok(sub && sub.body.prefs.marketing === false && sub.body.timezone === 'Europe/Warsaw', 'prefs (marketing OFF) + strefa Europe/Warsaw');
    ok((await p.getByTestId('push-status').innerText()).includes('Włączone'), 'status: Włączone na tym urządzeniu');
    await p.screenshot({ path: 'shots/ustawienia-wlaczone.png', fullPage: true });
    await p.getByTestId('toggle-marketing').click(); await p.waitForTimeout(500);
    const pr = calls.filter(c => c.path === '/api/push/prefs').pop();
    ok(pr && pr.body.prefs.marketing === true, 'zmiana przełącznika → POST /api/push/prefs');
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
    const sync = calls.filter(c => c.path === '/api/push/sync').pop();
    ok(!!sync, 'POST /api/push/sync po starcie');
    ok(sync && sync.body.items.length === 2 && sync.body.items.every(i => i.id && i.title && i.readyAt && !('amountGrosze' in i) && !('note' in i)), 'sync: tylko rzeczy czekające, bez kwot i notatek');
    ok(sync && sync.body.stats && sync.body.stats.waitingCount === 2 && sync.body.stats.overdueCount === 1 && sync.body.stats.skippedMonthCount === 1, 'sync: statystyki zbiorcze (Motywacyjne ON)');
    await p.goto(B + '/powiadomienia', { waitUntil: 'networkidle' });
    await p.getByTestId('toggle-automatic').click(); await p.waitForTimeout(400);
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
    const sync2 = calls.filter(c => c.path === '/api/push/sync').pop();
    ok(sync2 && sync2.body.items === undefined, 'Automatyczne OFF → nazwy rzeczy nie są wysyłane');

    console.log('4. Service worker: zdarzenie push → powiadomienie (tytuł, treść, deep link)');
    const cdp = await ctx.newCDPSession(p);
    let regId = null;
    cdp.on('ServiceWorker.workerRegistrationUpdated', e => { for (const r of e.registrations) if (!r.isDeleted) regId = r.registrationId; });
    await cdp.send('ServiceWorker.enable');
    await p.evaluate(() => navigator.serviceWorker.ready);
    for (let i = 0; i < 20 && !regId; i++) await p.waitForTimeout(200);
    ok(!!regId, 'rejestracja SW znaleziona');
    const payload = { title: 'Czas oddechu minął', body: '🛍️ Słuchawki nauszne nadal czeka! Minęły już 48 godzin. Nadal masz na nie ochotę?', url: '/?item=it-1', tag: 'ready-it-1', category: 'automatic' };
    await cdp.send('ServiceWorker.deliverPushMessage', { origin: B, registrationId: regId, data: JSON.stringify(payload) });
    await p.waitForTimeout(1200);
    const notes = await p.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map(n => ({ title: n.title, body: n.body, tag: n.tag, data: n.data, badge: n.badge, icon: n.icon })));
    const n = notes.find(x => x.tag === 'ready-it-1');
    ok(!!n, 'powiadomienie pokazane przez SW');
    ok(n && n.title === payload.title && n.body === payload.body, 'poprawny tytuł i treść');
    ok(n && n.data && n.data.url === '/?item=it-1', 'deep link /?item=it-1 w data.url');
    ok(n && n.badge.endsWith('/badge-96.png') && n.icon.endsWith('/icon-192.png'), 'ikona + monochromatyczna plakietka');
    await cdp.send('ServiceWorker.deliverPushMessage', { origin: B, registrationId: regId, data: JSON.stringify({ title: 'X', body: 'Y', url: 'https://evil.example/', tag: 'evil' }) });
    await p.waitForTimeout(800);
    const evil = (await p.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map(n => ({ tag: n.tag, data: n.data })))).find(x => x.tag === 'evil');
    ok(evil && evil.data.url === '/', 'link zewnętrzny zamieniony na "/"');

    console.log('5. Deep link do produktu');
    await p.goto(B + '/?item=it-1', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    ok(await p.locator('#item-it-1[data-highlight="true"]').count() === 1, 'rzecz z powiadomienia podświetlona');
    await p.screenshot({ path: 'shots/deeplink.png' });

    console.log('6. Wyłącz wszystkie → unsubscribe');
    await p.goto(B + '/powiadomienia', { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Wyłącz wszystkie' }).click(); await p.waitForTimeout(800);
    ok(calls.some(c => c.path === '/api/push/unsubscribe'), 'POST /api/push/unsubscribe');
    await ctx.close(); }

  console.log('7. Karta zgody (permission default) po dodaniu pierwszej rzeczy, "Nie teraz" zapamiętane');
  { const { ctx } = await ctxWith(b, [item('it-9', 'Krem', 2)]); const p = await ctx.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const perm = await p.evaluate(() => Notification.permission);
    ok(perm === 'default', 'uprawnienie: default');
    ok(await p.getByTestId('push-prompt').isVisible(), 'karta „Przypomnieć, gdy minie 48 godzin?” widoczna');
    await p.getByTestId('push-prompt').screenshot({ path: 'shots/prosba.png' });
    await p.getByRole('button', { name: 'Nie teraz' }).click();
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    ok(await p.getByTestId('push-prompt').count() === 0, 'po „Nie teraz” i przeładowaniu — schowana');
    await ctx.close(); }

  console.log('8. Prośba → klik „Tak, przypominaj” z przyznaną zgodą');
  { const { ctx, calls } = await ctxWith(b, [item('it-7', 'Bilet', 2)]); const p = await ctx.newPage();
    // systemowe okno zgody: symulujemy kliknięcie „Zezwól”
    await p.exposeFunction('grantNow', () => ctx.grantPermissions(['notifications'], { origin: B }));
    await p.addInitScript(() => { Notification.requestPermission = async () => { await window.grantNow(); return 'granted'; }; });
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
    ok(await p.getByTestId('push-prompt').isVisible(), 'karta widoczna');
    await p.getByRole('button', { name: 'Tak, przypominaj' }).click(); await p.waitForTimeout(1500);
    ok(calls.some(c => c.path === '/api/push/subscribe'), 'po kliknięciu → subskrypcja');
    ok(await p.getByTestId('push-prompt-result').isVisible(), 'potwierdzenie + link do ustawień');
    await ctx.close(); }

  console.log('9. /konto ma wejście do Powiadomień, polityka prywatności opisuje push');
  { const { ctx } = await ctxWith(b, []); const p = await ctx.newPage();
    await p.goto(B + '/konto', { waitUntil: 'networkidle' });
    ok(await p.getByRole('link', { name: /Powiadomienia/ }).isVisible(), 'link Powiadomienia w Więcej → Menu');
    await p.goto(B + '/prywatnosc', { waitUntil: 'networkidle' });
    const t = await p.locator('main').innerText();
    ok(t.includes('Powiadomienia push') && t.includes('Statystyki wizyt') && t.includes('Konto i plan Plus') && !t.includes('Nie wysyłamy ich na żaden serwer'), 'polityka: konto, wizyty, push — bez nieprawdziwego „nic nie wysyłamy”');
    await ctx.close(); }

  await b.close();
  console.log(`\nWYNIK: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
