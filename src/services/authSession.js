const ACCESS_TOKEN_CLOCK_SKEW_MS = 5_000;

const decodeJwtPayload = (token) => {
  const payload = token?.split('.')[1];
  if (!payload) throw new Error('Invalid JWT token.');

  const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const json = decodeURIComponent(
    globalThis
      .atob(padded)
      .split('')
      .map((character) => `%${character.codePointAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
  return JSON.parse(json);
};

export const parseJwt = (token) => {
  try {
    const parsed = decodeJwtPayload(token);
    const id = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      || parsed.sub || parsed.nameid || parsed.id;
    const username = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      || parsed.unique_name || parsed.name || parsed.username;
    const role = parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || parsed.role || 'User';

    return { id: Number(id), username, role };
  } catch {
    return null;
  }
};

export const hasUsableAccessToken = (token) => {
  try {
    const payload = decodeJwtPayload(token);
    return !payload.exp || payload.exp * 1_000 > Date.now() + ACCESS_TOKEN_CLOCK_SKEW_MS;
  } catch {
    return false;
  }
};

export const clearStoredAuthentication = () => {
  localStorage.removeItem('cpms_access_token');
  localStorage.removeItem('cpms_refresh_token');
  localStorage.removeItem('cpms_user');
};
