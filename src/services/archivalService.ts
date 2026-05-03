
export const logToMasterSheet = async (data: any) => {
  const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!SCRIPT_URL) {
    console.warn("Master Log: VITE_APPS_SCRIPT_URL not configured. Skipping archival.");
    return;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("Master Log Error:", err);
  }
};
