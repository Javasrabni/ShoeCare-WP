import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import { DropPoint } from "@/app/models/droppoint";
import { cache } from "react";

export const getDashboardStats = cache(async () => {
  await connectDB();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders,
    todayOrdersCount,
    pendingOrdersCount,
    processingOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    totalCustomers,
    newCustomersThisMonth,
    returningCustomers,
    totalCouriers,
    activeCouriersCount,
    totalDropPoints,
    dropPointsNearCapacity,
    totalStaff,
    staffOnDuty,
    revenueAgg,
    todayRevenueAgg,
    lastMonthRevenueAgg,
    monthlyRevenueAgg,
    statusBreakdown,
    paymentBreakdown,
    serviceBreakdown,
    topCustomersAgg,
    topCouriersData,
    dropPointData,
    recentOrdersData,
    avgTurnaroundAgg,
    completionRateAgg,
    avgRatingAgg,
    totalReviewsAgg,
    peakHoursAgg,
    avgResponseTimeAgg,
  ] = await Promise.all([
    // Basic counts
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ status: "waiting_confirmation" }),
    Order.countDocuments({
      status: {
        $in: [
          "processing",
          "in_workshop",
          "qc_check",
          "pickup_in_progress",
          "delivery_in_progress",
        ],
      },
    }),
    Order.countDocuments({ status: "completed" }),
    Order.countDocuments({ status: "cancelled" }),

    // Customers
    Users.countDocuments({ role: "customer" }),
    Users.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth },
    }),
    Users.countDocuments({ role: "customer", totalOrders: { $gt: 1 } }),

    // Couriers
    Users.countDocuments({ role: "courier" }),
    Users.countDocuments({ role: "courier", "courierInfo.isAvailable": true }),

    // Drop Points
    DropPoint.countDocuments(),
    DropPoint.countDocuments({
      $expr: { $gte: [{ $divide: ["$currentLoad", "$capacity"] }, 0.8] },
    }),

    // Staff
    Users.countDocuments({
      role: { $in: ["admin", "technician", "qc", "dropper"] },
    }),
    Users.countDocuments({
      role: { $in: ["admin", "technician", "qc", "dropper"] },
      isActive: true,
    }),

    // Revenue
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment.finalAmount" },
          avg: { $avg: "$payment.finalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment.finalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$payment.finalAmount" } } },
    ]),

    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$payment.finalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Breakdowns
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$payment.finalAmount" },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$payment.status",
          count: { $sum: 1 },
          amount: { $sum: "$payment.finalAmount" },
        },
      },
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.treatmentType",
          count: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Top Customers
    Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          "customerInfo.userId": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customerInfo.userId",
          name: { $first: "$customerInfo.name" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$payment.finalAmount" },
          lastOrder: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]),

    // Top Couriers
    Users.find({ role: "courier" }, { name: 1, courierInfo: 1, phone: 1 })
      .sort({ "courierInfo.totalDeliveries": -1 })
      .limit(5)
      .lean(),

    // Drop Points
    DropPoint.find().select("name address capacity currentLoad status").lean(),

    // Recent Orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "orderNumber customerInfo items status payment createdAt priority"
      )
      .lean(),

    // Operational Metrics
    Order.aggregate([
      {
        $match: {
          status: "completed",
          "tracking.completedTime": { $exists: true },
          createdAt: { $exists: true },
        },
      },
      {
        $project: {
          duration: { $subtract: ["$tracking.completedTime", "$createdAt"] },
        },
      },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
    ]),

    Order.countDocuments({ status: "completed" }).then((count) => ({
      total: count,
    })),

    Order.aggregate([
      { $match: { rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]),

    Order.countDocuments({ rating: { $exists: true } }),

    Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),

    // Placeholder untuk response time (bisa diganti dengan data real dari chat/notification system)
    Promise.resolve([{ _id: null, avgTime: 8 }]),
  ]);

  // Calculate metrics
  const currentMonthRevenue =
    monthlyRevenueAgg.find(
      (m: any) =>
        m._id ===
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    )?.revenue || 0;
  const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;
  const revenueGrowth =
    lastMonthRevenue > 0
      ? (
          ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
          100
        ).toFixed(1)
      : 0;

  const avgTurnaroundHours = avgTurnaroundAgg[0]?.avgDuration
    ? Math.round(avgTurnaroundAgg[0].avgDuration / (1000 * 60 * 60))
    : 0;

  const completionRate =
    totalOrders > 0
      ? Math.round((completedOrdersCount / totalOrders) * 100)
      : 0;
  const efficiencyRate =
    totalOrders > 0
      ? Math.round(
          ((completedOrdersCount + processingOrdersCount) / totalOrders) * 100
        )
      : 0;
  const retentionRate =
    totalCustomers > 0
      ? Math.round((returningCustomers / totalCustomers) * 100)
      : 0;

  const peakHour = peakHoursAgg[0]?._id;
  const peakHours =
    peakHour !== undefined
      ? `${String(peakHour).padStart(2, "0")}:00 - ${String(
          peakHour + 2
        ).padStart(2, "0")}:00`
      : "Belum ada data";

  // Labels
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    waiting_confirmation: "Menunggu Konfirmasi",
    confirmed: "Dikonfirmasi",
    courier_assigned: "Kurir Ditugaskan",
    pickup_in_progress: "Proses Jemput",
    picked_up: "Diambil",
    in_workshop: "Di Workshop",
    processing: "Diproses",
    qc_check: "QC Check",
    ready_for_delivery: "Siap Kirim",
    delivery_in_progress: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  const paymentLabels: Record<string, string> = {
    pending: "Menunggu",
    waiting_confirmation: "Konfirmasi",
    paid: "Dibayar",
    failed: "Gagal",
    refunded: "Dikembalikan",
  };

  const serviceLabels: Record<string, string> = {
    deep_clean: "Deep Clean",
    fast_clean: "Fast Clean",
    regular_clean: "Regular Clean",
    repair: "Perbaikan",
    recolor: "Pewarnaan Ulang",
    unyellowing: "Anti Kuning",
    waterproofing: "Waterproofing",
  };

  return {
    counts: {
      totalOrders,
      todayOrders: todayOrdersCount,
      pendingOrders: pendingOrdersCount,
      processingOrders: processingOrdersCount,
      completedOrders: completedOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      totalCustomers,
      totalCouriers,
      totalDropPoints,
      totalStaff,
    },
    newCustomersThisMonth,
    returningCustomers,
    activeCouriers: activeCouriersCount,
    dropPointsNearCapacity,

    revenue: {
      totalRevenue: revenueAgg[0]?.total || 0,
      avgOrderValue: Math.round(revenueAgg[0]?.avg || 0),
      totalOrders: revenueAgg[0]?.count || 0,
    },

    todayStats: {
      revenue: todayRevenueAgg[0]?.total || 0,
      orders: todayRevenueAgg[0]?.count || 0,
    },

    monthlyRevenue: monthlyRevenueAgg.map((m: any) => ({
      month: m._id,
      revenue: m.revenue,
      orderCount: m.orderCount,
    })),

    statusBreakdown: statusBreakdown.map((s: any) => ({
      status: s._id,
      label: statusLabels[s._id] || s._id,
      count: s.count,
      revenue: s.revenue,
    })),

    paymentBreakdown: paymentBreakdown.map((p: any) => ({
      status: p._id,
      label: paymentLabels[p._id] || p._id,
      count: p.count,
      amount: p.amount,
    })),

    serviceBreakdown: serviceBreakdown.map((s: any) => ({
      type: s._id,
      label: serviceLabels[s._id] || s._id,
      count: s.count,
      revenue: s.revenue,
    })),

    topCustomers: topCustomersAgg.map((c: any) => ({
      name: c.name || "Tidak diketahui",
      orderCount: c.orderCount,
      totalSpent: c.totalSpent,
      lastOrderDays: c.lastOrder
        ? Math.floor(
            (now.getTime() - new Date(c.lastOrder).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    })),

    topCouriers: topCouriersData.map((c: any) => ({
      name: c.name,
      completedOrders: c.courierInfo?.totalDeliveries || 0,
      todayDeliveries: c.courierInfo?.todayDeliveries || 0,
      totalDistance: (c.courierInfo?.totalDeliveries || 0) * 3.5,
      avgDeliveryTime: 0,
      totalRevenue: (c.courierInfo?.totalDeliveries || 0) * 15000,
      isAvailable: c.courierInfo?.isAvailable || false,
    })),

    dropPointUtilization: dropPointData.map((dp: any) => ({
      ...dp,
      utilizationRate:
        dp.capacity > 0 ? Math.floor((dp.currentLoad / dp.capacity) * 100) : 0,
    })),

    recentOrders: recentOrdersData.map((o: any) => ({
      orderNumber: o.orderNumber,
      customer: o.customerInfo?.name || "Guest",
      customerPhone: o.customerInfo?.phone,
      service:
        o.items
          ?.map((i: any) => serviceLabels[i.treatmentType] || i.treatmentType)
          .join(", ") || "Umum",
      status: o.status,
      paymentStatus: o.payment?.status,
      amount: o.payment?.finalAmount || 0,
      createdAt: o.createdAt,
      priority: o.priority || "medium",
    })),

    avgTurnaroundTime: avgTurnaroundHours,
    completionRate,
    avgRating: Math.round((avgRatingAgg[0]?.avgRating || 0) * 10) / 10,
    totalReviews: totalReviewsAgg,
    orderManagementRate: efficiencyRate,
    peakHours,
    peakHourOrderCount: peakHoursAgg[0]?.count || 0,
    customerRetentionRate: retentionRate,
    avgResponseTime: avgResponseTimeAgg[0]?.avgTime || 0,
    revenueGrowth,
  };
});
