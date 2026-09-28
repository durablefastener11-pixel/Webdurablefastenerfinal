export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const SUPABASE_URL = "https://kirmgyixhomfnnqdqhcb.supabase.co";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, accept-profile, content-profile, x-supabase-api-version, x-upsert",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ✅ Google Reviews Route
    if (url.pathname === "/api/reviews" && request.method === "GET") {
      const PLACE_ID = "ChIJr-Xe6gXLWTkR_HMq1UxmLzE";
      const CACHE_TTL = 60 * 60 * 24;

      const cache = caches.default;
      const cacheKey = new Request("https://internal-cache/google-reviews-v1");
      const cachedRes = await cache.match(cacheKey);

      if (cachedRes) {
        const cloned = new Response(cachedRes.body, cachedRes);
        cloned.headers.set("X-Cache", "HIT");
        cloned.headers.set("Access-Control-Allow-Origin", "*");
        return cloned;
      }

      try {
        const GOOGLE_API_KEY = env.GOOGLE_API_KEY;

        if (!GOOGLE_API_KEY) {
          return new Response(JSON.stringify({
            error: "Missing API key",
            details: "GOOGLE_API_KEY not set in Worker environment"
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const googleUrl =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${PLACE_ID}` +
          `&fields=name,rating,user_ratings_total,reviews` +
          `&language=en` +
          `&key=${GOOGLE_API_KEY}`;

        const googleRes = await fetch(googleUrl);
        const raw = await googleRes.json();

        if (!raw.result) {
          return new Response(JSON.stringify({
            error: "No result from Google",
            google_status: raw.status,
            raw_response: raw
          }), {
            status: 502,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const payload = {
          result: {
            reviews: raw.result.reviews || [],
            rating: raw.result.rating || 4.9,
            total: raw.result.user_ratings_total || 0,
          },
          cachedAt: new Date().toISOString(),
        };

        const response = new Response(JSON.stringify(payload), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_TTL}`,
            "Access-Control-Allow-Origin": "*",
            "X-Cache": "MISS",
          },
        });

        await cache.put(cacheKey, response.clone());
        return response;

      } catch (err) {
        return new Response(JSON.stringify({
          error: "Worker fetch failed",
          details: err.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // ✅ Baaki sab → Supabase proxy
    const newHeaders = new Headers(request.headers);
    newHeaders.delete("Host");
    newHeaders.set("Origin", SUPABASE_URL);
    newHeaders.set("Host", "wterhjmgsgyqgbwviomo.supabase.co");

    
   let body = null;
    // Only try to read the body if the request actually has one
    const hasBody = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    
    if (hasBody) {
      const contentType = request.headers.get("content-type");
      if (contentType) {
        // We use arrayBuffer to ensure binary data (like images) stays intact
        body = await request.clone().arrayBuffer();
        // If the body is empty after all, set it back to null
        if (body.byteLength === 0) body = null;
      }
    }

    const modifiedRequest = new Request(
      SUPABASE_URL + url.pathname + url.search,
      { 
        method: request.method, 
        headers: newHeaders, 
        body: body, // Will be null for GET/HEAD/Empty DELETE
        redirect: "follow" 
      }
    );
    try {
      const response = await fetch(modifiedRequest);
      const newResponseHeaders = new Headers(response.headers);
      newResponseHeaders.set("Access-Control-Allow-Origin", "*");
      newResponseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      newResponseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info, accept-profile, content-profile, x-supabase-api-version, x-upsert");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newResponseHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
  },
};
