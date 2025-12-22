// lib/fetcher.ts
import { fetchClient } from "./fetchClient";

export const fetcher = async (url: string) => {
  const res = await fetchClient(url);

  let json: any = null;

  try {
    json = await res.json();
  } catch (e) {
    throw new Error("Invalid JSON response from API");
  }

  if (!res.ok) {
    // forward backend error message if available
    const message = json?.message || "Failed to fetch";
    const err = new Error(message);
    (err as any).status = res.status;
    (err as any).info = json;
    throw err;
  }

  return json;
};
