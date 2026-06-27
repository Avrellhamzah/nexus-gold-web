/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Mengizinkan semua gambar dari Supabase Storage Anda
      },
    ],
  },
};

export default nextConfig;