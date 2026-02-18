import React from 'react'

interface TableType {
    title: React.ReactNode[];
    data: React.ReactNode[][]
}

const Table = ({ title, data }: TableType) => {
    return (
        <div className="w-full overflow-x-auto bg-neutral-primary-soft rounded-lg border border-(--border)">
            <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="text-sm text-body bg-neutral-secondary-medium">
                    <tr className="border-b border-(--border)">
                        {title.map((i, idx) => {
                            // ✅ Max-width berbeda per kolom
                            const maxWidths = [
                                "max-w-[40px]",   // No
                                "max-w-full",  // Map
                                "max-w-fit",  // Nama DP
                                "max-w-[900px]",  // Alamat
                                "max-w-fit",  // Radius
                                "max-w-fit",  // Biaya
                                "max-w-[150px]",  // Admin
                                "max-w-[120px]",  // Navigasi
                            ]

                            return (
                                <th
                                    key={idx}
                                    className={`px-1 md:px-1 py-3 font-medium whitespace-nowrap w-full ${maxWidths[idx]} truncate ${idx !== title.length - 1 ? "border-r border-stone-200" : ""}`}
                                >
                                    <span className="block truncate text-center">{i}</span>
                                </th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-(--border) last:border-b-0">
                            {row.map((cell, cellIndex) => {
                                const maxWidths = [
                                    "max-w-[40px]",
                                    "max-w-full",
                                    "max-w-fit",
                                    "max-w-[400px]",
                                    "max-w-[180px]",
                                    "max-w-[180px]",
                                    "max-w-[150px]",
                                    "max-w-[120px]",
                                ]

                                return (
                                    <td
                                        key={cellIndex}
                                        className={`px-2 md:px-4 py-4 border-r border-(--border) last:border-r-0 ${maxWidths[cellIndex]} warp-break-words whitespace-normal`}
                                    >
                                        <span className={`block ${cellIndex === 3 ? 'text-left w-70' : 'text-center'}`}>
                                            {cell}
                                        </span>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Table
