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
  Calendar,
  Activity,
  Star,
  Route,
  Timer,
  Zap,
  Target,
  Phone,
  Navigation,
  Box,
  RefreshCw,
  HelpCircle,
  Info
} from "lucide-react";
import { formatRupiah } from "@/utils/formatRupiah";
import { getDashboardStats } from "@/lib/dashboard";
import { cache } from "react";

const getCachedDashboardStats = cache(getDashboardStats);

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan" | "slate";
  trend?: { value: number; label: string };
  tooltip?: string;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-600",
  slate: "bg-slate-50 text-slate-600"
};

// Tooltip Component
function TooltipInfo({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex ml-2 z-50">
      <HelpCircle size={14} className="text-slate-400 cursor-help hover:text-slate-600" />
      <div className="fixed hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-lg z-[9999] pointer-events-none shadow-xl"
        style={{
          transform: 'translate(-50%, -100%)',
          marginTop: '-8px'
        }}>
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}

// Skeleton Components
function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <SkeletonPulse className="h-3 w-24" />
          <SkeletonPulse className="h-8 w-16" />
          <SkeletonPulse className="h-2 w-20" />
        </div>
        <SkeletonPulse className="h-12 w-12 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-5 w-5 rounded" />
          <SkeletonPulse className="h-4 w-32" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-200 rounded-2xl h-48 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon: Icon, color, trend, tooltip }: StatsCardProps) {
  return (
    <div className="group bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {tooltip && <TooltipInfo text={tooltip} />}
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]} shrink-0 ml-3`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = "", tooltip }: SectionProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className={`p-1.5 rounded-lg ${colorMap.blue}`}>
          <Icon size={18} />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{title}</h2>
        {tooltip && <TooltipInfo text={tooltip} />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { color: keyof typeof colorMap; label: string; icon: React.ElementType }> = {
    waiting_confirmation: { color: "amber", label: "Menunggu", icon: Clock },
    confirmed: { color: "blue", label: "Dikonfirmasi", icon: CheckCircle },
    courier_assigned: { color: "violet", label: "Kurir Ditugaskan", icon: Truck },
    pickup_in_progress: { color: "violet", label: "Proses Jemput", icon: Navigation },
    picked_up: { color: "cyan", label: "Diambil", icon: Package },
    in_workshop: { color: "slate", label: "Di Workshop", icon: Store },
    processing: { color: "blue", label: "Diproses", icon: Loader2 },
    qc_check: { color: "emerald", label: "QC Check", icon: CheckCircle },
    ready_for_delivery: { color: "emerald", label: "Siap Kirim", icon: Box },
    delivery_in_progress: { color: "amber", label: "Dikirim", icon: Truck },
    completed: { color: "emerald", label: "Selesai", icon: CheckCircle },
    cancelled: { color: "rose", label: "Dibatalkan", icon: XCircle }
  };

  const style = styles[status] || { color: "slate", label: status, icon: AlertCircle };
  const IconComponent = style.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[style.color]}`}>
      <IconComponent size={12} />
      {style.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, { color: keyof typeof colorMap; label: string }> = {
    pending: { color: "amber", label: "Menunggu" },
    waiting_confirmation: { color: "amber", label: "Konfirmasi" },
    paid: { color: "emerald", label: "Dibayar" },
    failed: { color: "rose", label: "Gagal" },
    refunded: { color: "slate", label: "Dikembalikan" }
  };

  const style = styles[status] || { color: "slate", label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[style.color]}`}>
      <Wallet size={12} />
      {style.label}
    </span>
  );
}

function PriorityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: "bg-rose-50 text-rose-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-blue-50 text-blue-700"
  };

  const labels = {
    high: "Prioritas Tinggi",
    medium: "Prioritas Sedang",
    low: "Prioritas Rendah"
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const data = await getCachedDashboardStats();

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Ringkasan operasional ShoeCare</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent data={data} />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardContent({ data }: { data: any }) {
  const revenueGrowth = Number(data.revenueGrowth || 0);

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="bg-white rounded-xl  overflow-hidden">
        <div className="p-6 md:py-8 md:px-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <p className="text-emerald-600 font-semibold">Rp</p>
                  {/* <DollarSign size={20} className="text-emerald-600" /> */}
                </div>
                <span className="text-sm font-medium text-slate-500">Total Pendapatan</span>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                {formatRupiah(data.revenue?.totalRevenue || 0)}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                <MetricItem label="Rata-rata Order" value={formatRupiah(data.revenue?.avgOrderValue || 0)} />
                <MetricItem label="Total Transaksi" value={(data.revenue?.totalOrders || 0).toLocaleString()} />
                <MetricItem label="Hari Ini" value={formatRupiah(data.todayStats?.revenue || 0)} highlight={true} />
                <MetricItem label="Bulan Ini" value={formatRupiah(data.monthlyRevenue?.[data.monthlyRevenue.length - 1]?.revenue || 0)} />
              </div>
            </div>

            <div className="flex items-center gap-4 lg:border-l lg:border-slate-100 lg:pl-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-2xl mb-2">
                  <TrendingUp size={32} className="text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">vs bulan lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      {(data.counts?.pendingOrders > 0 || data.counts?.processingOrders > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.counts?.pendingOrders > 0 && (
            <AlertCard
              type="warning"
              icon={AlertCircle}
              title="Pesanan Menunggu"
              description={`${data.counts.pendingOrders} pesanan perlu ditinjau`}
            />
          )}
          {data.counts?.processingOrders > 0 && (
            <AlertCard
              type="info"
              icon={Clock}
              title="Sedang Diproses"
              description={`${data.counts.processingOrders} pesanan dalam penanganan`}
            />
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Pesanan"
          value={(data.counts?.totalOrders || 0).toLocaleString()}
          subtitle={`${data.counts?.pendingOrders || 0} menunggu konfirmasi`}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Pelanggan"
          value={(data.counts?.totalCustomers || 0).toLocaleString()}
          subtitle={`${data.newCustomersThisMonth || 0} baru bulan ini`}
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="Kurir"
          value={(data.counts?.totalCouriers || 0).toLocaleString()}
          subtitle={`${data.activeCouriers || 0} sedang aktif`}
          icon={Truck}
          color="violet"
        />
        <StatsCard
          title="Drop Point"
          value={(data.counts?.totalDropPoints || 0).toLocaleString()}
          subtitle={`${data.dropPointsNearCapacity || 0} hampir penuh`}
          icon={MapPin}
          color="amber"
        />
        <StatsCard
          title="Staff"
          value={(data.counts?.totalStaff || 0).toLocaleString()}
          icon={UserCheck}
          color="rose"
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OperationalCard
          title="Waktu Selesai"
          value={`${data.avgTurnaroundTime || 0}j`}
          subtitle="Rata-rata per pesanan"
          icon={Timer}
          color="cyan"
          tooltip="Waktu rata-rata dari pesanan masuk hingga selesai dikerjakan (dalam jam)"
        />
        <OperationalCard
          title="Tingkat Selesai"
          value={`${data.completionRate || 0}%`}
          subtitle="Tepat waktu"
          icon={Target}
          color="emerald"
          tooltip="Persentase pesanan yang selesai dari total pesanan yang masuk"
        />
        <OperationalCard
          title="Kepuasan"
          value={`${data.avgRating || 0}/5`}
          subtitle={`${data.totalReviews || 0} ulasan`}
          icon={Star}
          color="amber"
          tooltip="Rating rata-rata dari ulasan pelanggan (skala 1-5)"
        />
        <OperationalCard
          title="Manajemen Pesanan"
          value={`${data.orderManagementRate || 0}%`}
          subtitle="Pesanan tertangani"
          icon={Zap}
          color="violet"
          tooltip="Persentase pesanan yang berhasil ditangani: (Selesai + Diproses) / Total Pesanan × 100%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Status Pesanan" icon={Activity} tooltip="Distribusi pesanan berdasarkan status terkini">
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {data.statusBreakdown?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusBadge status={item.status} />
                  <span className="text-sm text-slate-600 truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 text-sm">{item.count}</p>
                    {item.revenue > 0 && <p className="text-xs text-slate-400">{formatRupiah(item.revenue)}</p>}
                  </div>
                  <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${Math.min((item.count / Math.max(data.counts?.totalOrders, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Status Pembayaran" icon={CreditCard} tooltip="Distribusi status pembayaran dari semua pesanan">
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {data.paymentBreakdown?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PaymentBadge status={item.status} />
                  <span className="text-sm text-slate-600 truncate">{item.label}</span>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-semibold text-slate-900 text-sm">{item.count}</p>
                  <p className="text-xs text-slate-400">{formatRupiah(item.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <SectionCard title="Layanan Populer" icon={Package} tooltip="Jenis layanan yang paling sering dipesan">
          <div className="space-y-4">
            {data.serviceBreakdown?.map((item: any) => {
              const percentage = Math.min((item.count / Math.max(data.counts?.totalOrders, 1)) * 100, 100);
              return (
                <div key={item.type} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className="text-slate-500">{item.count} pesanan</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>{percentage.toFixed(1)}% dari total</span>
                    <span>{formatRupiah(item.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Pelanggan Terbaik" icon={Users} tooltip="Pelanggan dengan total pembelian tertinggi">
          <div className="space-y-3">
            {!data.topCustomers || data.topCustomers.length === 0 ? (
              <EmptyState icon={Users} message="Belum ada data pelanggan" />
            ) : (
              data.topCustomers.map((customer: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <RankBadge rank={idx} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{customer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <ShoppingCart size={10} />
                          {customer.orderCount} kali pesan
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 text-sm">{formatRupiah(customer.totalSpent)}</p>
                    <p className="text-[10px] text-slate-400">
                      {customer.lastOrderDays > 0 ? `${customer.lastOrderDays} hari lalu` : 'Hari ini'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Kurir Terbaik" icon={Truck} tooltip="Kurir dengan pengiriman terbanyak dan jarak tempuh terjauh">
          <div className="space-y-3">
            {!data.topCouriers || data.topCouriers.length === 0 ? (
              <EmptyState icon={Truck} message="Belum ada data kurir" />
            ) : (
              data.topCouriers.map((courier: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <RankBadge rank={idx} color="violet" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{courier.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Package size={10} />
                          {courier.completedOrders} selesai
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Route size={10} />
                          {(courier.totalDistance || 0).toFixed(1)} km
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 text-sm">{formatRupiah(courier.totalRevenue)}</p>
                    <p className="text-[10px] text-slate-400">
                      {courier.avgDeliveryTime > 0 ? `Rata-rata ${courier.avgDeliveryTime} menit` : '-'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* Drop Point Utilization */}
      <SectionCard title="Status Drop Point" icon={MapPin} tooltip="Kapasitas dan utilisasi drop point saat ini">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Lokasi</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Kapasitas</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Terisi</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!data.dropPointUtilization || data.dropPointUtilization.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    <EmptyState icon={MapPin} message="Belum ada drop point" />
                  </td>
                </tr>
              ) : (
                data.dropPointUtilization.map((dp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin size={18} className="text-slate-500" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 text-sm block">{dp.name}</span>
                          <span className="text-xs text-slate-400 truncate max-w-[200px] block">{dp.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-medium text-slate-900">{dp.currentLoad} / {dp.capacity}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${dp.utilizationRate >= 80 ? 'bg-rose-500' : dp.utilizationRate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${dp.utilizationRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-10 text-right">{dp.utilizationRate}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${colorMap[dp.status === 'Aktif' ? 'emerald' : 'rose']}`}>
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
      <SectionCard title="Pesanan Terbaru" icon={Clock} tooltip="10 pesanan yang masuk paling akhir">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">No. Pesanan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pelanggan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Layanan</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pembayaran</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!data.recentOrders || data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <EmptyState icon={ShoppingCart} message="Belum ada pesanan" />
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 text-sm">#{order.orderNumber}</span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className="text-sm text-slate-700 block">{order.customer}</span>
                        {order.customerPhone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            {order.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-600">{order.service}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-slate-900 text-sm">{formatRupiah(order.amount)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Monthly Revenue Chart - DENGAN PENJELASAN */}
      <SectionCard
        title="Grafik Pendapatan"
        icon={TrendingUp}
        tooltip="Tinggi batang biru menunjukkan besarnya pendapatan per bulan. Semakin tinggi = semakin besar pendapatan."
      >
        {!data.monthlyRevenue || data.monthlyRevenue.length === 0 ? (
          <EmptyState icon={TrendingUp} message="Belum ada data pendapatan" />
        ) : (
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
              <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Cara membaca grafik:</p>
                <p className="text-xs text-blue-700 mt-1">
                  Setiap batang biru mewakili 1 bulan. Tinggi batang menunjukkan jumlah pendapatan.
                  Bandingkan tinggi batang untuk melihat pertumbuhan bisnis Anda.
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-64 overflow-x-auto pb-2">
              {data.monthlyRevenue.map((item: any) => {
                const maxRevenue = Math.max(...data.monthlyRevenue.map((m: any) => m.revenue));
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const monthName = new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short' });

                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 min-w-[60px] flex-1 group cursor-pointer">
                    <div className="relative w-full bg-slate-100 rounded-t-lg overflow-hidden" style={{ height: '160px' }}>
                      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg group-hover:bg-blue-600 transition-colors" style={{ height: `${height}%` }} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {formatRupiah(item.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">{monthName}</p>
                      <p className="text-[10px] text-slate-400">{item.orderCount || 0} pesanan</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Rata-rata Bulanan</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatRupiah(data.monthlyRevenue.reduce((a: number, b: any) => a + b.revenue, 0) / data.monthlyRevenue.length)}
                </p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Pertumbuhan</p>
                <p className="text-lg font-bold text-emerald-600">
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Proyeksi Tahun</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatRupiah((data.monthlyRevenue.reduce((a: number, b: any) => a + b.revenue, 0) / data.monthlyRevenue.length) * 12)}
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InsightCard
          title="Jam Sibuk"
          value={data.peakHours || "-"}
          subtitle="Waktu pesanan terbanyak"
          icon={Clock}
          trend={data.peakHourOrderCount ? `${data.peakHourOrderCount} pesanan` : 'Belum ada data'}
          tooltip="Jam dengan jumlah pesanan masuk tertinggi dalam sehari"
        />
        <InsightCard
          title="Pelanggan Setia"
          value={`${data.customerRetentionRate || 0}%`}
          subtitle="Kembali memesan lagi"
          icon={RefreshCw}
          trend={`${data.returningCustomers || 0} dari ${data.counts?.totalCustomers || 0} pelanggan`}
          tooltip="Persentase pelanggan yang pernah memesan lebih dari 1 kali"
        />
        <InsightCard
          title="Kecepatan Respon"
          value={`${data.avgResponseTime || 0}m`}
          subtitle="Rata-rata balas chat"
          icon={Zap}
          trend={data.avgResponseTime < 15 ? 'Cepat' : 'Perlu ditingkatkan'}
          tooltip="Waktu rata-rata admin membalas pesan/chat dari pelanggan (dalam menit)"
        />
      </div>
    </div>
  );
}

// Helper Components
function MetricItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-emerald-600 text-lg' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function AlertCard({ type, icon: Icon, title, description }: { type: 'warning' | 'info'; icon: React.ElementType; title: string; description: string }) {
  const styles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className={`rounded-xl p-4 flex items-center border ${styles[type]} shadow-xs`}>
      <div className={`p-2 rounded-lg ${type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'} mr-4`}>
        <Icon size={24} className={type === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-80 mt-0.5">{description}</p>
      </div>
      <ArrowUpRight size={20} className="opacity-50" />
    </div>
  );
}

function OperationalCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  tooltip
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: keyof typeof colorMap;
  tooltip?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
        <div className="flex items-center">
          <span className="text-xs font-medium text-slate-500">{title}</span>
          {tooltip && <TooltipInfo text={tooltip} />}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function RankBadge({ rank, color = "blue" }: { rank: number; color?: "blue" | "violet" }) {
  const colors: Record<number, string> = {
    0: "bg-amber-100 text-amber-700",
    1: "bg-slate-200 text-slate-700",
    2: "bg-orange-100 text-orange-700"
  };
  const defaultColor = color === "violet" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700";

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${colors[rank] || defaultColor}`}>
      {rank + 1}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-8 text-slate-400">
      <Icon size={32} className="mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tooltip
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-sm font-medium text-slate-500">{title}</span>
          {tooltip && <TooltipInfo text={tooltip} />}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon size={18} className="text-slate-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-xs text-slate-500 mb-2">{subtitle}</p>
      <p className="text-xs font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
        {trend}
      </p>
    </div>
  );
}