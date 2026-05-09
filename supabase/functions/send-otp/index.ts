import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, code, purpose } = await req.json();
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length !== 10 || !/^\d{6}$/.test(String(code || ""))) {
      return new Response(JSON.stringify({ error: "Invalid phone or code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const from = Deno.env.get("TWILIO_FROM_NUMBER");
    if (!sid || !token || !from) {
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneE164 = digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
    const to = `whatsapp:${phoneE164}`;
    const fromWa = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
    const body = purpose === "edit_request"
      ? `The OTP for editing the blood request is ${code}. Valid for 5 minutes.`
      : `Your Blood Bank verification code is ${code}. Valid for 5 minutes.`;

    const auth = btoa(`${sid}:${token}`);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: fromWa, Body: body }).toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio error:", data);
      return new Response(JSON.stringify({ error: data.message || "Failed to send SMS" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sid: data.sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
