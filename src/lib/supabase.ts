import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Next_Public_Supabase_Url or Next_Public_Supabase_Anon_Key in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // PENTING: Agar sesi login tersimpan di cookie/storage untuk middleware
    autoRefreshToken: true,
  },
});

// Fungsi Global untuk Audit Trail
export const logAdminAction = async (
  adminEmail: string,
  actionType: 'PRICING' | 'TRANSACTION' | 'INVENTORY' | 'SYSTEM',
  description: string,
  targetTable?: string,
  recordId?: string
) => {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      admin_email: adminEmail,
      action_type: actionType,
      description: description,
      target_table: targetTable,
      record_id: recordId
    }]);

    if (error) {
      console.error("CRITICAL ERROR: Gagal mencatat Audit Trail", error);
      // Dalam sistem nyata berisiko tinggi, kegagalan log bisa dikonfigurasi 
      // untuk menghentikan operasi atau mengirim peringatan ke email Super Admin.
    }
  } catch (err) {
    console.error("System Error pada Audit Trail:", err);
  }
};