export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET() {
  const API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const PLACE_ID = process.env.PLACE_ID;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!API_KEY || !PLACE_ID) {
    return Response.json(
      { error: "Missing API key or Place ID in environment variables" },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews&key=${API_KEY}`
    );

    if (!res.ok) throw new Error("Failed to fetch from Google API");

    const data = await res.json();

    if (data.status !== "OK") {
      return Response.json(
        { error: data.error_message || data.status },
        { status: 400, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        name: data.result.name,
        rating: data.result.rating,
        totalRatings: data.result.user_ratings_total,
        reviews: data.result.reviews || [],
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
