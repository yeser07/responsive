/**
 * Smoke tests against a running API.
 * Start the backend first: npm run dev
 * Then: npm test
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function parseSetCookie(headers) {
  const raw = headers.getSetCookie ? headers.getSetCookie() : [];
  const list = raw.length ? raw : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
  const cookies = {};
  for (const entry of list) {
    const [pair] = entry.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    cookies[name] = value;
  }
  return cookies;
}

function cookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers,
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const setCookies = parseSetCookie(response.headers);

  return { status: response.status, data, setCookies };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  console.log(`Running smoke tests against ${BASE_URL}`);

  const health = await request('/health');
  assert(health.status === 200, `Expected /health 200, got ${health.status}`);
  assert(health.data?.status === 'ok', 'Health payload invalid');

  const loginFail = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'nope', password: 'wrong' },
  });
  assert(loginFail.status === 401, `Expected login fail 401, got ${loginFail.status}`);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    },
  });
  assert(login.status === 200, `Expected login 200, got ${login.status}`);
  assert(login.data?.user?.username, 'Login did not return user');
  assert(login.setCookies.accessToken, 'Login did not set accessToken cookie');
  assert(login.setCookies.refreshToken, 'Login did not set refreshToken cookie');

  let cookies = { ...login.setCookies };
  const cookie = cookieHeader(cookies);

  const unauthorized = await request('/api/users');
  assert(unauthorized.status === 401, `Expected 401 without token, got ${unauthorized.status}`);

  const users = await request('/api/users?page=1&rowsPerPage=10', { cookie });
  assert(users.status === 200, `Expected /api/users 200, got ${users.status}`);
  assert(Array.isArray(users.data?.items), 'Users items missing');

  const me = await request('/api/auth/me', { cookie });
  assert(me.status === 200, `Expected /api/auth/me 200, got ${me.status}`);
  assert(me.data?.user?.username, 'me did not return username');
  assert(me.data?.user?.role, 'me did not return role');

  const refresh = await request('/api/auth/refresh', {
    method: 'POST',
    cookie: cookieHeader({ refreshToken: cookies.refreshToken }),
  });
  assert(refresh.status === 200, `Expected refresh 200, got ${refresh.status}`);
  assert(refresh.setCookies.accessToken, 'Refresh did not set accessToken cookie');
  assert(refresh.setCookies.refreshToken, 'Refresh did not set refreshToken cookie');
  cookies = { ...cookies, ...refresh.setCookies };

  const cis = await request(
    '/api/cis?page=1&rowsPerPage=5&sortBy=%5B%22className%22%5D&sortType=%5B%22asc%22%5D',
    { cookie: cookieHeader(cookies) }
  );
  assert(cis.status === 200, `Expected /api/cis 200, got ${cis.status}`);
  assert(Array.isArray(cis.data?.items), 'CIs items missing');

  const assignments = await request('/api/assignments?page=1&rowsPerPage=10', {
    cookie: cookieHeader(cookies),
  });
  assert(assignments.status === 200, `Expected /api/assignments 200, got ${assignments.status}`);
  assert(Array.isArray(assignments.data?.items), 'Assignments items missing');

  const letters = await request('/api/letters?page=1&rowsPerPage=10', {
    cookie: cookieHeader(cookies),
  });
  assert(letters.status === 200, `Expected /api/letters 200, got ${letters.status}`);
  assert(Array.isArray(letters.data?.items), 'Letters items missing');

  const dashboard = await request('/api/reports/dashboard', { cookie: cookieHeader(cookies) });
  assert(dashboard.status === 200, `Expected dashboard 200, got ${dashboard.status}`);

  const search = await request('/api/search?q=admin', { cookie: cookieHeader(cookies) });
  assert(search.status === 200, `Expected search 200, got ${search.status}`);

  const uniqueUser = `smoke_${Date.now()}`;
  const created = await request('/api/admins', {
    method: 'POST',
    cookie: cookieHeader(cookies),
    body: { username: uniqueUser, password: 'secret123' },
  });
  assert(created.status === 201, `Expected create admin 201, got ${created.status}`);
  assert(created.data?.username === uniqueUser, 'Created admin username mismatch');

  const admins = await request('/api/admins', { cookie: cookieHeader(cookies) });
  assert(admins.status === 200, `Expected /api/admins 200, got ${admins.status}`);
  assert(Array.isArray(admins.data), 'Admins response is not an array');
  assert(
    admins.data.some((a) => a.username === uniqueUser),
    'Created admin not listed'
  );

  const deleted = await request(`/api/admins/${created.data._id}`, {
    method: 'DELETE',
    cookie: cookieHeader(cookies),
  });
  assert(deleted.status === 200, `Expected delete admin 200, got ${deleted.status}`);

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    cookie: cookieHeader(cookies),
  });
  assert(logout.status === 200, `Expected logout 200, got ${logout.status}`);

  console.log('All smoke tests passed');
}

run().catch((error) => {
  console.error('Smoke tests failed:', error.message);
  process.exit(1);
});
