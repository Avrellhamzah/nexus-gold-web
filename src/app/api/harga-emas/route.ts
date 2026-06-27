import { NextResponse } from "next/server";

export async function GET() {
  // Dalam skenario nyata, ini ditarik dari API harga spot (misal: metalpriceapi.com)
  // Untuk saat ini, kita gunakan nilai basis yang mendekati grafik Anda (73 juta / troy ounce)
  const troyOunceToGram = 31.103;
  const baseSpotOunceIDR = 73460000; 
  
  // Simulasi fluktuasi pasar dunia (bergerak tiap detik)
  const fluctuation = Math.floor(Math.random() * 50000) - 25000; 
  const liveSpotOunceIDR = baseSpotOunceIDR + fluctuation;
  
  // Kalkulasi Harga Murni per Gram
  const rawGramPrice = liveSpotOunceIDR / troyOunceToGram;
  
  // Kalkulasi Prediksi Antam (Asumsi Premium Margin 11% untuk pecahan 1 gram)
  const antamPremiumMargin = 0.11; 
  const estimatedAntamPrice = rawGramPrice + (rawGramPrice * antamPremiumMargin);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    liveSpotOunceIDR: Math.round(liveSpotOunceIDR),
    rawGramPrice: Math.round(rawGramPrice),
    estimatedAntamPrice: Math.round(estimatedAntamPrice),
  });
}