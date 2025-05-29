// app/api/sensor/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get("mac");

  if (!mac) {
    return new Response(JSON.stringify({ error: "MAC address is required" }), {
      status: 400,
    });
  }

  try {
    const response = await fetch(process.env.TROLMASTER_API_URL!, {
      method: "POST",
      headers: {
        "x-api-key": process.env.TROLMASTER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cmd: "getSensorData",
        params: {
          mac,
          model: "Hydro-X",
        },
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Failed to fetch data: ${err}` }), {
      status: 500,
    });
  }
}
