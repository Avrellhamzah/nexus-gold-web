import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase"; 

export async function POST(req: Request) {
  try {
    // Tangkap sinyal JSON dari server BiteShip
    const payload = await req.json();

    // Pastikan sinyal ini adalah "Event Perubahan Status Pesanan"
    if (payload.event === "order.status") {
      const biteshipOrderId = payload.order_id;
      const biteshipStatus = payload.status; 

      let invoiceStatus = "";

      // Menerjemahkan kamus status BiteShip menjadi status Enterprise Nexus Gold
      switch (biteshipStatus) {
        case "confirmed":
        case "allocated":
        case "picking_up":
        case "picked":
          invoiceStatus = "DIPROSES"; // Kurir berhasil dipanggil dan sedang menjemput barang
          break;
        case "dropping_off":
          invoiceStatus = "DIKIRIM";  // Barang sudah di tangan kurir dan menuju lokasi klien
          break;
        case "delivered":
          invoiceStatus = "SELESAI";  // Klien telah menerima aset fisiknya
          break;
        case "cancelled":
        case "rejected":
          invoiceStatus = "BATAL";    // Pengiriman gagal atau dibatalkan sepihak
          break;
        default:
          invoiceStatus = "";
      }

      // Jika ada instruksi perubahan yang valid, sinkronisasikan ke Database kita
      if (invoiceStatus !== "") {
        /* Catatan Arsitektur: 
          Pada pembuatan order sebelumnya, kita menyimpan ID Pesanan BiteShip (orderData.id) 
          ke dalam kolom 'shipping_label_url' di tabel invoices kita.
        */
        const { error } = await supabase
          .from("invoices")
          .update({ status: invoiceStatus })
          .eq("shipping_label_url", biteshipOrderId);

        if (error) throw error;
      }
    }

    // Selalu kembalikan status 200 OK agar robot BiteShip tahu pesan sudah kita terima
    return NextResponse.json({ success: true, message: "Sinyal logistik dikonfirmasi" });

  } catch (error: any) {
    console.error("CRITICAL: Biteship Webhook Error ->", error.message);
    // Kembalikan 500 jika gagal agar BiteShip mencoba mengirim ulang sinyalnya nanti
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}