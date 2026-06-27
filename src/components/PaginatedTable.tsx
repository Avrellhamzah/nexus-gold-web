"use client";

import { useState, useMemo } from "react";

// Definisi Tipe Generik untuk Kolom
export interface TableColumn<T> {
  header: string;
  accessor?: keyof T; // Key dari data (jika render teks langsung)
  render?: (item: T) => React.ReactNode; // Fungsi render custom (untuk tombol, badge, dll)
  align?: "left" | "center" | "right";
  width?: string;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  itemsPerPage?: number;
  emptyMessage?: string;
}

export default function PaginatedTable<T>({ 
  data, 
  columns, 
  itemsPerPage = 10, 
  emptyMessage = "Tidak ada data." 
}: PaginatedTableProps<T>) {
  
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  return (
    <div className="bg-[#121412] rounded border border-[#2E3730] shadow-2xl overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#161B18] border-b border-[#2E3730]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 font-semibold text-[#C5A059] text-[10px] uppercase tracking-wider ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.width || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E3730]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item: any, rowIndex) => (
                <tr key={item.id || rowIndex} className="hover:bg-[#161B18] transition-colors group">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {col.render ? col.render(item) : (item[col.accessor as string] || "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* KONTROL PAGINASI */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[#2E3730] bg-[#161B18] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, data.length)} dari {data.length} Baris
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-[#2E3730] rounded text-xs text-zinc-400 hover:bg-[#2E3730] hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-[#2E3730] rounded text-xs text-zinc-400 hover:bg-[#2E3730] hover:text-white disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}