import { Suspense } from "react";
import { 
  Users, 
  ShoppingCart, 
  MapPin, 
  UserCheck, 
  Package, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Truck,
  Store,
  Calendar
} from "lucide-react";
import { formatRupiah } from "@/utils/formatRupiah";
import { getDashboardStats } from "@/lib/dashboard";

function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: any; 
  color: string; 
  trend?: { value: number; label: string } 
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} shrink-0 ml-3`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending", icon: Clock },
    waiting_confirmation: { bg: "bg-orange-50", text: "text-orange-700", label: "Menunggu", icon: AlertCircle },
    confirmed: { bg: "bg-blue-50", text: "text-blue-700", label: "Dikonfirmasi", icon: CheckCircle },
    courier_assigned: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Kurir Ditugaskan", icon: Truck },
    pickup_in_progress: { bg: "bg-purple-50", text: "text-purple-700", label: "Proses Jemput", icon: Truck },
    picked_up: { bg: "bg-pink-50", text: "text-pink-700", label: "Diambil", icon: Package },
    in_workshop: { bg: "bg-teal-50", text: "text-teal-700", label: "Di Workshop", icon: Store },
    processing: { bg: "bg-cyan-50", text: "text-cyan-700", label: "Diproses", icon: Loader2 },
    qc_check: { bg: "bg-lime-50", text: "text-lime-700", label: "QC Check", icon: CheckCircle },
    ready_for_delivery: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Siap Kirim", icon: Package },
    delivery_in_progress: { bg: "bg-amber-50", text: "text-amber-700", label: "Dikirim", icon: Truck },
    completed: { bg: "bg-green-50", text: "text-green-700", label: "Selesai", icon: CheckCircle },
    cancelled: { bg: "bg-rose-50", text: "text-rose-700", label: "Dibatalkan", icon: XCircle }
  };

  const style = styles[status] || { bg: "bg-gray-50", text: "text-gray-700", label: status, icon: AlertCircle };
  const IconComponent = style.icon;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <IconComponent size={12} className="mr-1.5" />
      {style.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Menunggu" },
    waiting_confirmation: { bg: "bg-orange-50", text: "text-orange-700", label: "Konfirmasi" },
    paid: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Dibayar" },
    failed: { bg: "bg-rose-50", text: "text-rose-700", label: "Gagal" },
    refunded: { bg: "bg-gray-50", text: "text-gray-700", label: "Dikembalikan" }
  };

  const style = styles[status] || { bg: "bg-gray-50", text: "text-gray-700", label: status };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Wallet size={12} className="mr-1.5" />
      {style.label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-7 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-11 w-11 bg-gray-200 rounded-xl shrink-0"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1,2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1,2,3,4,5].map(j => (
                <div key={j} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ 
  title, 
  icon: Icon, 
  children, 
  className = "" 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <div className="p-1.5 bg-blue-50 rounded-lg">
          <Icon size={18} className="text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardStats();

  return (
    <div className="min-h-screen p-0 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Ringkasan dan statistik sistem ShoeCare</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-xs">
            <Calendar size={16} className="text-blue-500" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Alert Cards */}
        {(data.counts.pendingOrders > 0 || data.counts.processingOrders > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.counts.pendingOrders > 0 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center text-white shadow-lg shadow-amber-200">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Pesanan Menunggu</p>
                  <p className="text-white/90 text-sm">{data.counts.pendingOrders} order perlu ditinjau segera</p>
                </div>
                <ArrowUpRight size={20} className="text-white/70" />
              </div>
            )}
            {data.counts.processingOrders > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-4 flex items-center text-white shadow-lg shadow-blue-200">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Sedang Diproses</p>
                  <p className="text-white/90 text-sm">{data.counts.processingOrders} order dalam penanganan</p>
                </div>
                <ArrowUpRight size={20} className="text-white/70" />
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Orders"
            value={data.counts.totalOrders.toLocaleString()}
            subtitle={`${data.counts.pendingOrders} menunggu`}
            icon={ShoppingCart}
            color="bg-blue-500"
          />
          <StatsCard
            title="Customers"
            value={data.counts.totalCustomers.toLocaleString()}
            icon={Users}
            color="bg-emerald-500"
          />
          <StatsCard
            title="Couriers"
            value={data.counts.totalCouriers.toLocaleString()}
            icon={UserCheck}
            color="bg-violet-500"
          />
          <StatsCard
            title="Drop Points"
            value={data.counts.totalDropPoints.toLocaleString()}
            icon={MapPin}
            color="bg-amber-500"
          />
          <StatsCard
            title="Staff"
            value={data.counts.totalStaff.toLocaleString()}
            icon={Package}
            color="bg-rose-500"
          />
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign size={20} className="text-white" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Total Pendapatan</p>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">{formatRupiah(data.revenue.totalRevenue)}</p>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                <div>
                  <p className="text-blue-200 text-xs mb-1">Rata-rata Order</p>
                  <p className="font-semibold text-white text-lg">{formatRupiah(data.revenue.avgOrderValue)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs mb-1">Total Transaksi</p>
                  <p className="font-semibold text-white text-lg">{data.revenue.totalOrders}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs mb-1">Hari Ini</p>
                  <p className="font-semibold text-white text-lg">{formatRupiah(data.todayStats.revenue)}</p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-3">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <TrendingUp size={48} className="text-white/90" />
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs">Performance</p>
                <p className="text-white font-semibold">+12.5% vs bulan lalu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Status Pesanan" icon={ShoppingCart}>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {data.statusBreakdown.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <StatusBadge status={item.status} />
                    <span className="text-sm text-gray-600 truncate">{item.label}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-gray-900">{item.count}</p>
                    {item.revenue > 0 && (
                      <p className="text-xs text-gray-400">{formatRupiah(item.revenue)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Status Pembayaran" icon={CreditCard}>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {data.paymentBreakdown.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <PaymentBadge status={item.status} />
                    <span className="text-sm text-gray-600 truncate">{item.label}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-400">{formatRupiah(item.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Service Type & Top Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SectionCard title="Tipe Layanan" icon={TrendingUp}>
            <div className="space-y-4">
              {data.serviceBreakdown.map((item: any) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                    <span className="text-sm text-gray-500">{item.count} order</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((item.count / Math.max(data.counts.totalOrders, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 text-right">{formatRupiah(item.revenue)}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Top Customers" icon={Users}>
            <div className="space-y-3">
              {data.topCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada data</p>
                </div>
              ) : (
                data.topCustomers.map((customer: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-600' :
                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.orderCount} order</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm shrink-0">{formatRupiah(customer.totalSpent)}</p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Top Couriers" icon={Truck}>
            <div className="space-y-3">
              {data.topCouriers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Truck size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada data</p>
                </div>
              ) : (
                data.topCouriers.map((courier: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-600' :
                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-violet-100 text-violet-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{courier.name}</p>
                        <p className="text-xs text-gray-400">{courier.deliveries} pengiriman</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm shrink-0">{formatRupiah(courier.totalRevenue)}</p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* Drop Point Utilization */}
        <SectionCard title="Utilisasi Drop Point" icon={MapPin} className="overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kapasitas</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penggunaan</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.dropPointUtilization.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada drop point</p>
                    </td>
                  </tr>
                ) : (
                  data.dropPointUtilization.map((dp: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-amber-600" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{dp.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-500 truncate max-w-[200px] block" title={dp.address}>{dp.address}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{dp.currentLoad} / {dp.capacity}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                dp.utilizationRate >= 80 ? 'bg-rose-500' : 
                                dp.utilizationRate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${dp.utilizationRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-10 text-right">{dp.utilizationRate}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          dp.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {dp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Recent Orders */}
        <SectionCard title="Pesanan Terbaru" icon={Clock} className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Layanan</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembayaran</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada order</p>
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700">{order.customer}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-500">{order.service}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-gray-900 text-sm">{formatRupiah(order.amount)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Monthly Revenue */}
        <SectionCard title="Pendapatan Bulanan" icon={TrendingUp}>
          {data.monthlyRevenue.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
              <p>Belum ada data pendapatan</p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-48 overflow-x-auto pb-2">
              {data.monthlyRevenue.map((item: any) => {
                const maxRevenue = Math.max(...data.monthlyRevenue.map((m: any) => m.revenue));
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 min-w-[60px] flex-1">
                    <div className="relative w-full bg-blue-50 rounded-t-xl overflow-hidden" style={{ height: '120px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-500 hover:from-blue-500 hover:to-blue-300"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-900">
                        {formatRupiah(item.revenue).replace(/[^\d]/g, '').slice(0, 2)}jt
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}