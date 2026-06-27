import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { destination_postal_code, items } = await req.json();
    
    // Tarik kredensial dari environment
    const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;
    const RAW_ORIGIN_POSTAL = process.env.BITESHIP_ORIGIN_POSTAL_CODE;

    if (!BITESHIP_API_KEY) {
      throw new Error("Sistem logistik belum dikonfigurasi (API Key hilang).");
    }

    // --- PROTEKSI MUTLAK: PEMBERSIH KARAKTER (SANITIZER) ---
    // Menghapus spasi, enter (\r\n), atau huruf tak terlihat dari .env dan input klien
    // Menggunakan regex /\D/g untuk membuang semua yang bukan angka
    const cleanOrigin = RAW_ORIGIN_POSTAL ? String(RAW_ORIGIN_POSTAL).replace(/\D/g, '') : "13820";
    const cleanDestination = destination_postal_code ? String(destination_postal_code).replace(/\D/g, '') : "";

    // Validasi akhir sebelum terbang ke server BiteShip
    if (cleanOrigin.length !== 5) {
      throw new Error(`Kode pos asal dari .env tidak valid (${cleanOrigin}). Harus 5 digit.`);
    }
    if (cleanDestination.length !== 5) {
      throw new Error(`Kode pos Klien tidak valid (${cleanDestination}). Harus 5 digit.`);
    }

    // Payload murni untuk BiteShip
    const payload = {
      origin_postal_code: cleanOrigin,
      destination_postal_code: cleanDestination,
      couriers: "tiki,paxel",
      items: items.map((item: any) => ({
        name: item.name,
        value: Number(item.price), // Memastikan format angka
        weight: Number(item.weight_grams) || 10, // Memastikan format angka
        quantity: Number(item.quantity) // Memastikan format angka
      }))
    };

    const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        // Membersihkan spasi pada API Key jika ada
        "Authorization": `Bearer ${String(BITESHIP_API_KEY).trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Jika BiteShip masih menolak, kita log error aslinya ke terminal VS Code Anda
    if (!response.ok) {
      console.error("BiteShip Reject Payload:", JSON.stringify(payload, null, 2));
      console.error("BiteShip Error Message:", data);
      throw new Error(data.error || "Gagal menghubungi satelit logistik. Cek Terminal Anda.");
    }

    return NextResponse.json({ success: true, rates: data.pricing });

  } catch (error: any) {
    console.error("Shipping API Error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}