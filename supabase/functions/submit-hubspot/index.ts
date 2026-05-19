import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const HUBSPOT_URL = "https://api.hsforms.com/submissions/v3/integration/submit/44368510/abcb4e00-e2b8-434f-8892-656dbc62eef6";

const shouldIncludePageContext = (pageUri?: string) => {
  if (!pageUri) return false;

  try {
    const host = new URL(pageUri).hostname.toLowerCase();

    // HubSpot flags lovable preview/public domains as "Unregistered Site Domain" spam.
    if (
      host.endsWith("lovable.app") ||
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const getClientIp = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const firstIp = forwarded.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();

  return firstIp || realIp || undefined;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Build HubSpot payload
    const fields = [
      { objectTypeId: "0-1", name: "firstname", value: body.firstName || "" },
      { objectTypeId: "0-1", name: "lastname", value: body.lastName || "" },
      { objectTypeId: "0-1", name: "email", value: body.email || "" },
      { objectTypeId: "0-1", name: "phone", value: body.phone || "" },
      { objectTypeId: "0-1", name: "company", value: body.company || "" },
      { objectTypeId: "0-1", name: "annualrevenue", value: body.annualRevenue || "" },
      { objectTypeId: "0-1", name: "source_reported_by_lead", value: body.howDidYouHear || "" },
      { objectTypeId: "0-2", name: "name", value: body.company || "" },
    ];

    // Add UTM fields if present
    if (body.utm_source) fields.push({ objectTypeId: "0-1", name: "utm_source", value: body.utm_source });
    if (body.utm_medium) fields.push({ objectTypeId: "0-1", name: "utm_medium", value: body.utm_medium });
    if (body.utm_campaign) fields.push({ objectTypeId: "0-1", name: "utm_campaign", value: body.utm_campaign });
    if (body.utm_content) fields.push({ objectTypeId: "0-1", name: "utm_content", value: body.utm_content });
    if (body.utm_term) fields.push({ objectTypeId: "0-1", name: "utm_term", value: body.utm_term });

    const pageContext = shouldIncludePageContext(body.pageUri)
      ? {
          pageUri: body.pageUri,
          pageName: body.pageName || "",
        }
      : {};

    const ipAddress = getClientIp(req);

    const context = {
      ...(body.hutk ? { hutk: body.hutk } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      ...pageContext,
    };

    const hubspotPayload: Record<string, unknown> = {
      submittedAt: Date.now().toString(),
      fields,
    };

    if (Object.keys(context).length > 0) {
      hubspotPayload.context = context;
    }

    console.log("Submitting to HubSpot:", JSON.stringify(hubspotPayload));

    const res = await fetch(HUBSPOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hubspotPayload),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("HubSpot error:", res.status, responseText);
      return new Response(JSON.stringify({ success: false, error: responseText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("HubSpot success:", responseText);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in submit-hubspot:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
