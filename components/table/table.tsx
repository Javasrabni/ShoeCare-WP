import React from 'react'

interface TableType {
    title: string[];
    data: React.ReactNode[][]
}

const Table = ({ title, data }: TableType) => {
    return (
        <div className="w-full overflow-x-auto bg-neutral-primary-soft rounded-lg border border-(--border)">
            <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="text-sm text-body bg-neutral-secondary-medium border border-(--border)">
                    <tr>
                        {title.map((i, idx) => (
                            <th key={idx} className={`px-6 py-3 font-medium ${idx !== title.length - 1 && "border-r border-stone-200"}`}>
                                {i}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-6 w-fit py-4 border border-(--border)">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Table
