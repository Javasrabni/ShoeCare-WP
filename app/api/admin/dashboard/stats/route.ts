import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import { DropPoint } from "@/app/models/droppoint";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // ====== TOTAL COUNTS ======
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await Users.countDocuments({ role: "customer" });
    const totalCouriers = await Users.countDocuments({ role: "courier" });
    const totalDropPoints = await DropPoint.countDocuments({ status: "Aktif" });
    const totalStaff = await Users.countDocuments({
      role: { $in: ["admin", "dropper", "technician", "qc"] }
    });

    // ====== ORDER STATUS BREAKDOWN ======
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$payment.finalAmount" }
        }
      }
    ]);

    // ====== PAYMENT STATUS BREAKDOWN ======
    const paymentBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$payment.status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$payment.finalAmount" }
        }
      }
    ]);

    // ====== SERVICE TYPE BREAKDOWN ======
    const serviceBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$payment.finalAmount" }
        }
      }
    ]);

    // ====== REVENUE STATS ======
    const revenueStats = await Order.aggregate([
      {
        $match: {
          "payment.status": "paid"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payment.finalAmount" },
          avgOrderValue: { $avg: "$payment.finalAmount" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // ====== MONTHLY REVENUE (last 12 months) ======
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          "payment.status": "paid",
          paidAt: { $ne: null }
        }
      },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          amount: "$payment.finalAmount"
        }
      },
      {
        $group: {
          _id: "$month",
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ====== TOP CUSTOMERS (by total spent) ======
    const topCustomers = await Order.aggregate([
      {
        $match: {
          "payment.status": "paid",
          "customerInfo.userId": { $ne: null }
        }
      },
      {
        $group: {
          _id: "$customerInfo.userId",
          name: { $first: "$customerInfo.name" },
          totalSpent: { $sum: "$payment.finalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);

    // ====== TOP COURIERS (by deliveries completed) ======
    const topCouriers = await Order.aggregate([
      {
        $match: {
          status: "completed",
          "tracking.courierId": { $ne: null }
        }
      },
      {
        $group: {
          _id: "$tracking.courierId",
          name: { $first: "$tracking.courierName" },
          deliveries: { $sum: 1 },
          totalRevenue: { $sum: "$payment.finalAmount" }
        }
      },
      { $sort: { deliveries: -1 } },
      { $limit: 5 }
    ]);

    // ====== DROP POINT UTILIZATION ======
    const dropPointUtilization = await DropPoint.find({}, "name address capacity currentLoad status")
      .lean()
      .sort({ currentLoad: -1 })
      .limit(5);

    // ====== RECENT ORDERS (last 10) ======
    const recentOrders = await Order.find()
      .select("orderNumber customerInfo serviceType status payment.finalAmount payment.status createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // ====== TODAY'S SUMMARY ======
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "paid"] }, "$payment.finalAmount", 0]
            }
          },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "paid"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // ====== PENDING ORDERS ALERT ======
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["pending", "waiting_confirmation"] }
    });

    const processingOrders = await Order.countDocuments({
      status: { $in: ["confirmed", "courier_assigned"] }
    });

    // ====== FORMAT DATA ======
    const formatStatusBreakdown = () => {
      const statusMap: Record<string, string> = {
        pending: "Menunggu Konfirmasi",
        waiting_confirmation: "Menunggu Pembayaran",
        confirmed: "Dikonfirmasi",
        courier_assigned: "Kurir Ditujuk",
        pickup_in_progress: "Proses Jemput",
        picked_up: "Diambil",
        in_workshop: "Di Workshop",
        processing: "Diproses",
        qc_check: "QC Check",
        ready_for_delivery: "Siap Kirim",
        delivery_in_progress: "Dikirim",
        completed: "Selesai",
        cancelled: "Dibatalkan"
      };

      return statusBreakdown.map(item => ({
        status: item._id,
        label: statusMap[item._id] || item._id,
        count: item.count,
        revenue: item.totalRevenue
      }));
    };

    const formatPaymentBreakdown = () => {
      const paymentMap: Record<string, string> = {
        pending: "Menunggu Pembayaran",
        waiting_confirmation: "Menunggu Konfirmasi",
        paid: "Dibayar",
        failed: "Gagal",
        refunded: "Dikembalikan"
      };

      return paymentBreakdown.map(item => ({
        status: item._id,
        label: paymentMap[item._id] || item._id,
        count: item.count,
        amount: item.totalAmount
      }));
    };

    const formatServiceBreakdown = () => {
      const serviceMap: Record<string, string> = {
        "antar-jemput": "Antar Jemput",
        "drop-point": "Drop Point"
      };

      return serviceBreakdown.map(item => ({
        type: item._id,
        label: serviceMap[item._id] || item._id,
        count: item.count,
        revenue: item.totalRevenue
      }));
    };

    return NextResponse.json({
      success: true,
      data: {
        // Counts
        counts: {
          totalOrders,
          totalCustomers,
          totalCouriers,
          totalDropPoints,
          totalStaff,
          pendingOrders,
          processingOrders
        },

        // Revenue
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          avgOrderValue: 0,
          totalOrders: 0
        },

        // Breakdowns
        statusBreakdown: formatStatusBreakdown(),
        paymentBreakdown: formatPaymentBreakdown(),
        serviceBreakdown: formatServiceBreakdown(),

        // Top lists
        topCustomers: topCustomers.map(c => ({
          name: c.name,
          totalSpent: c.totalSpent,
          orderCount: c.orderCount
        })),
        topCouriers: topCouriers.map(c => ({
          name: c.name,
          deliveries: c.deliveries,
          totalRevenue: c.totalRevenue
        })),
        dropPointUtilization: dropPointUtilization.map(dp => ({
          name: dp.name,
          address: dp.address,
          capacity: dp.capacity,
          currentLoad: dp.currentLoad,
          utilizationRate: dp.capacity > 0 ? Math.round((dp.currentLoad / dp.capacity) * 100) : 0,
          status: dp.status
        })),

        // Recent data
        recentOrders: recentOrders.map(o => ({
          orderNumber: o.orderNumber,
          customer: o.customerInfo.name,
          service: o.serviceType === "antar-jemput" ? "Antar Jemput" : "Drop Point",
          status: o.status,
          amount: o.payment.finalAmount,
          paymentStatus: o.payment.status,
          createdAt: o.createdAt
        })),

        // Monthly revenue
        monthlyRevenue: monthlyRevenue.map(m => ({
          month: m._id,
          revenue: m.revenue,
          orders: m.orders
        })),

        // Today's stats
        todayStats: todayStats[0] || {
          totalOrders: 0,
          revenue: 0,
          paidOrders: 0
        }
      }
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}