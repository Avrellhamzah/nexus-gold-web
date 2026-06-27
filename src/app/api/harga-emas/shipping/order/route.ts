import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const { invoice_id, customer_name, customer_phone, customer_email, shipping_address, destination_postal, courier_company, courier_type, items } = await req.json();
    
    const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;

    // 1. Permintaan Pembuatan Resi ke BiteShip
    const payload = {
      shipper_contact_name: "Nexus Gold Logistic",
      shipper_contact_phone: "081234567890", // Nomor Admin
      shipper_contact_email: "logistics@nexusgold.com",
      origin_postal_code: process.env.BITESHIP_ORIGIN_POSTAL_CODE,
      destination_contact_name: customer_name,
      destination_contact_phone: customer_phone,
      destination_contact_email: customer_email,
      destination_address: shipping_address,
      destination_postal_code: destination_postal,
      courier_company: courier_company, // cth: "tiki" atau "paxel"
      courier_type: courier_type,       // cth: "ons" (TIKI) atau "same_day" (Paxel)
      delivery_type: "now",             // Minta kurir langsung pickup
      items: items.map((item: any) => ({
        name: item.name,
        value: item.price,
        weight: item.weight_grams || 10,
        quantity: item.quantity
      }))
    };

    const response = await fetch("https://api.biteship.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BITESHIP_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const orderData = await response.json();

    if (!response.ok) throw new Error(orderData.error || "Gagal mencetak resi logistik.");

    // 2. Simpan Nomor Resi ke Supabase (Tabel Invoices)
    const { error: dbError } = await supabase
      .from('invoices')
      .update({
        courier_name: `${orderData.courier.company.toUpperCase()} - ${orderData.courier.type}`,
        tracking_number: orderData.courier.waybill_id, // Nomor Resi
        shipping_label_url: orderData.id // ID untuk cetak label logistik
      })
      .eq('id', invoice_id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, tracking_number: orderData.courier.waybill_id });

  } catch (error: any) {
    console.error("Create Shipping Order Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}