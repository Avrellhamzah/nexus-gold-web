import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { destination_postal_code, items } = await req.json();
    
    // 1. Tarik dan bersihkan kredensial dari environment
    const rawApiKey = process.env.BITESHIP_API_KEY || "";
    const BITESHIP_API_KEY = rawApiKey.replace(/['"]/g, '').trim();
    const RAW_ORIGIN_POSTAL = process.env.BITESHIP_ORIGIN_POSTAL_CODE;

    if (!BITESHIP_API_KEY) {
      throw new Error("Sistem logistik belum dikonfigurasi (API Key hilang).");
    }

    // 2. Pembersih Karakter Klien & Env (Hapus huruf/spasi yang tersembunyi)
    const cleanOriginStr = RAW_ORIGIN_POSTAL ? String(RAW_ORIGIN_POSTAL).replace(/\D/g, '') : "13820";
    const cleanDestStr = destination_postal_code ? String(destination_postal_code).replace(/\D/g, '') : "";

    if (cleanOriginStr.length !== 5 || cleanDestStr.length !== 5) {
      throw new Error(`Kode pos harus 5 digit angka murni. Asal: ${cleanOriginStr}, Tujuan: ${cleanDestStr}`);
    }

    // 3. PAYLOAD MUTLAK: KONVERSI KE ANGKA (INTEGER)
    // Di sinilah kunci utamanya. BiteShip menolak 'String' untuk kode pos.
    const payload = {
      origin_postal_code: parseInt(cleanOriginStr, 10),      // Wajib Number
      destination_postal_code: parseInt(cleanDestStr, 10), // Wajib Number
      couriers: "tiki,paxel",
      items: items.map((item: any) => ({
        name: String(item.name).substring(0, 50), 
        value: parseInt(item.price, 10),
        weight: parseInt(item.weight_grams || 10, 10),
        quantity: parseInt(item.quantity, 10)
      }))
    };

    // 4. Eksekusi ke Satelit BiteShip
    const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BITESHIP_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("BiteShip Reject Payload:", JSON.stringify(payload, null, 2));
      console.error("BiteShip Error Message:", data);
      
      const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      throw new Error(errorMsg || "Gagal menghubungi satelit logistik BiteShip.");
    }

    return NextResponse.json({ success: true, rates: data.pricing });

  } catch (error: any) {
    console.error("Shipping API Error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}