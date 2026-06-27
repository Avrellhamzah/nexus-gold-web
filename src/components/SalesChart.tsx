"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SalesChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-[#121412] p-6 rounded border border-[#2E3730] shadow-2xl">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-6">Trend Pendapatan (7 Hari Terakhir)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E3730" />
          <XAxis dataKey="date" stroke="#666" fontSize={12} />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#161B18', borderColor: '#2E3730', color: '#fff' }} 
            itemStyle={{ color: '#C5A059' }}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#C5A059" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#C5A059' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}