export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return res.status(200).json({
      vercel: null,
      error: "Variables VERCEL_API_TOKEN y VERCEL_PROJECT_ID no configuradas"
    });
  }

  try {
    const now = Date.now();
    const day7ago = now - 7 * 24 * 60 * 60 * 1000;
    const day30ago = now - 30 * 24 * 60 * 60 * 1000;

    const headers = {
      "Authorization": "Bearer " + VERCEL_TOKEN,
      "Content-Type": "application/json",
    };

    const [statsRes, pagesRes] = await Promise.all([
      fetch(
        "https://api.vercel.com/v1/web/insights/stats?projectId=" + VERCEL_PROJECT_ID +
        "&from=" + day7ago + "&to=" + now + "&filter={}",
        { headers }
      ),
      fetch(
        "https://api.vercel.com/v1/web/insights/pages?projectId=" + VERCEL_PROJECT_ID +
        "&from=" + day7ago + "&to=" + now + "&limit=5&filter={}",
        { headers }
      ),
    ]);

    const stats = statsRes.ok ? await statsRes.json() : null;
    const pages = pagesRes.ok ? await pagesRes.json() : null;

    return res.status(200).json({
      vercel: {
        pageviews: stats?.data?.pageviews?.value ?? null,
        visitors: stats?.data?.visitors?.value ?? null,
        bounceRate: stats?.data?.bounceRate?.value ?? null,
        avgDuration: stats?.data?.sessionDuration?.value ?? null,
        topPages: pages?.data ?? [],
      }
    });
  } catch (e) {
    return res.status(200).json({ vercel: null, error: e.message });
  }
}
