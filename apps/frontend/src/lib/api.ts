const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, init);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
