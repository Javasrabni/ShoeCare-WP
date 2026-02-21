// app/admin/order-history/page.tsx
"use client"

import { useState, useEffect } from "react"
import { 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon, 
  EyeIcon, 
  CalendarIcon,
  UserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon
} from "lucide-react"
import { useRouter } from "next/navigation"

interface OrderLog {
  _id: string
  orderNumber: string
  customerInfo: {
    name: string
    phone: string
    isGuest: boolean
  }
  status: string
  createdAt: string
  totalEdits: number
  totalStatusChanges: number
  latestAction: {
    status: string
    timestamp: string
    updatedBy: string
  } | null
  logs: Array<{
    type: string
    timestamp: string
    title?: string
    status?: string
    updatedBy: string
    notes?: string
    icon: string
  }>
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderLog | null>(null)
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    orderNumber: ""
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchHistory()
  }, [pagination.page, filters])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const res = await fetch(`/api/admin/orders/history?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setOrders(data.data)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error("Failed to fetch history")
    }
    setLoading(false)
  }

  const exportData = async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    params.append("format", "csv")

    const res = await fetch(`/api/admin/orders/export?${params}`)
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `order-history-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "pending": "bg-yellow-100 text-yellow-800",
      "confirmed": "bg-blue-100 text-blue-800",
      "picked_up": "bg-purple-100 text-purple-800",
      "in_workshop": "bg-gray-100 text-gray-800",
      "processing": "bg-indigo-100 text-indigo-800",
      "completed": "bg-green-100 text-green-800",
      "cancelled": "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">History & Log Order</h1>
          <p className="text-gray-500">Lihat semua aktivitas dan perubahan status order</p>
        </div>
        <button 
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <DownloadIcon className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nomor order..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={filters.orderNumber}
            onChange={(e) => setFilters({...filters, orderNumber: e.target.value})}
          />
        </div>
        
        <select 
          className="p-2 border rounded-lg"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_workshop">In Workshop</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="relative">
          <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="date" 
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            placeholder="Dari tanggal"
          />
        </div>

        <div className="relative">
          <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="date" 
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            placeholder="Sampai tanggal"
          />
        </div>

        <button 
          onClick={() => {
            setFilters({ status: "", dateFrom: "", dateTo: "", orderNumber: "" })
            setPagination(prev => ({ ...prev, page: 1 }))
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Reset Filter
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aktivitas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Update Terakhir</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-blue-600">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customerInfo.name}</p>
                      <p className="text-xs text-gray-500">{order.customerInfo.phone}</p>
                      {order.customerInfo.isGuest && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Guest</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {order.totalStatusChanges} status change
                        </span>
                        {order.totalEdits > 0 && (
                          <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">
                            {order.totalEdits} edit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {order.latestAction ? (
                        <div>
                          <p className="text-sm">{order.latestAction.updatedBy}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.latestAction.timestamp).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Menampilkan {orders.length} dari {pagination.total} order
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 border rounded-lg">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Detail Log</h2>
                  <p className="text-gray-500 font-mono">{selectedOrder.orderNumber}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {selectedOrder.logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg shrink-0">
                      {log.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{log.title || log.status}</p>
                          <p className="text-sm text-gray-600">{log.notes}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {log.updatedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}