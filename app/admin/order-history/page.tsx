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
  ClockIcon,
  RefreshCwIcon,
  PackageIcon,
  FileTextIcon,
  XIcon,
  HistoryIcon,
  Loader2Icon,
  ChevronDownIcon,
  MoreHorizontalIcon
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
      "pending": "bg-amber-100 text-amber-700 border-amber-200",
      "confirmed": "bg-blue-100 text-blue-700 border-blue-200",
      "picked_up": "bg-purple-100 text-purple-700 border-purple-200",
      "in_workshop": "bg-gray-100 text-gray-700 border-gray-200",
      "processing": "bg-indigo-100 text-indigo-700 border-indigo-200",
      "completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "cancelled": "bg-red-100 text-red-700 border-red-200"
    }
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "pending": "Pending",
      "confirmed": "Confirmed",
      "picked_up": "Picked Up",
      "in_workshop": "In Workshop",
      "processing": "Processing",
      "completed": "Completed",
      "cancelled": "Cancelled"
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Memuat status order dan history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 z-30">
        <div className="max-w-7xl mx-auto py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Orders</span>
                <span>/</span>
                <span className="text-blue-600 font-medium">History & Logs</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">History & Log Order</h1>
              <p className="text-gray-500 text-sm mt-1">Lihat semua aktivitas dan perubahan status order</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 cursor-pointer text-white rounded-xl hover:bg-green-600 font-medium transition-colors shadow-sm shadow-emerald-200"
              >
                <DownloadIcon className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={fetchHistory}
                className="p-2.5 border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCwIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mt-6">
            <div className="flex-1 max-w-md relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor order..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={filters.orderNumber}
                onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div className="relative">
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>

              <button
                onClick={() => {
                  setFilters({ status: "", dateFrom: "", dateTo: "", orderNumber: "" })
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-medium text-sm transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HistoryIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-gray-500">Belum ada order history yang tersedia</p>
          </div>
        ) : (
          <>
            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktivitas</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Terakhir</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <PackageIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{order.customerInfo.name}</p>
                              <p className="text-xs text-gray-500">{order.customerInfo.phone}</p>
                            </div>
                          </div>
                          {order.customerInfo.isGuest ? (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              Guest
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-xs bg-gray-100 text-blue-700 px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              Member
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-current'}`}></span>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                              <HistoryIcon className="w-3 h-3" />
                              {order.totalStatusChanges} changes
                            </span>
                            {order.totalEdits > 0 && (
                              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                                <FileTextIcon className="w-3 h-3" />
                                {order.totalEdits} edits
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.latestAction ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{order.latestAction.updatedBy}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <ClockIcon className="w-3 h-3" />
                                {new Date(order.latestAction.timestamp).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Menampilkan <span className="font-semibold text-gray-900">{orders.length}</span> dari <span className="font-semibold text-gray-900">{pagination.total}</span> order
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${pagination.page === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 3 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HistoryIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Detail Log</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedOrder.customerInfo.name}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.customerInfo.phone}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-blue-500" />
                  Timeline Aktivitas
                </h3>

                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {selectedOrder.logs.map((log, idx) => (
                    <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Icon */}
                      <div className="relative z-10 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg border-4 border-white shadow-sm">
                        {log.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">{log.title || log.status}</p>
                            {log.notes && (
                              <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-gray-500" />
                          </div>
                          {log.updatedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}