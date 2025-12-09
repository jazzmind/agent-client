const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function withBasePath(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (!basePath) return url;
  // Ensure single slash between basePath and url
  if (url.startsWith('/')) {
    return `${basePath}${url}`;
  }
  return `${basePath}/${url}`;
}

export async function apiFetch(input: string, init?: RequestInit) {
  return fetch(withBasePath(input), init);
}
