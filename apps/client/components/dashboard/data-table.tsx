"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  keyField?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyText = "Tidak ada data.",
  keyField = "id",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-10 text-center text-[14px] text-[#6E6E73]">
        <div className="inline-block w-5 h-5 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin mb-3" />
        <p>Memuat data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-10 text-center text-[14px] text-[#6E6E73]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#F0F0F5]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-3 text-left text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F5F7]">
          {data.map((row) => (
            <tr
              key={row[keyField]}
              className="hover:bg-[#F9F9FB] transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-6 py-4 text-[14px] text-[#1D1D1F]", col.className)}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
