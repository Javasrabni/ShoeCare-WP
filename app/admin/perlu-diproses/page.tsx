// app/admin/need-processing/page.tsx
"use client"

import { useEffect, useState } from "react"
import { TruckIcon, MapPinIcon, PhoneIcon, CheckIcon, Loader2Icon } from "lucide-react"

interface Order {
  _id: string
  orderNumber: string
  customerInfo: { name: string; phone: string }
  pickupLocation: { address: string; dropPointName: string; coordinates: { lat: number; lng: number } }
  status: string
}

interface Courier {
  _id: string
  name: string
  phone: string
  courierInfo: { vehicleType: string; vehicleNumber: string; currentLocation?: { lat: number; lng: number } }
  distance: number | null
  status: 'free' | 'busy'
  statusLabel: string
}

export default function NeedProcessingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders/need-processing")
    const data = await res.json()
    if (data.success) setOrders(data.data)
    setLoading(false)
  }

  const fetchCouriers = async (order: Order) => {
    setSelectedOrder(order)
    const params = new URLSearchParams()
    if (order.pickupLocation.coordinates) {
      params.append("lat", order.pickupLocation.coordinates.lat.toString())
      params.append("lng", order.pickupLocation.coordinates.lng.toString())
    }
    
    const res = await fetch(`/api/admin/couriers/available?${params}`)
    const data = await res.json()
    if (data.success) setCouriers(data.data)
  }

  const handleAssign = async (courierId: string) => {
    if (!selectedOrder) return
    setAssigning(courierId)
    
    const res = await fetch(`/api/admin/orders/${selectedOrder._id}/assign-courier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courierId })
    })

    if (res.ok) {
      // Update status to pickup_in_progress
      await fetch(`/api/admin/orders/${selectedOrder._id}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "pickup_in_progress",
          notes: "Kurir menuju lokasi customer"
        })
      })
      
      fetchOrders()
      setSelectedOrder(null)
    }
    setAssigning(null)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Order Perlu Diproses</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order._id} 
              onClick={() => fetchCouriers(order)}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                selectedOrder?._id === order._id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                  <p className="text-xs text-gray-400">{order.pickupLocation.address}</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {order.status === 'confirmed' ? 'Belum Assign' : 'Assigned'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Courier Selection */}
        {selectedOrder && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-bold text-lg mb-4">Pilih Kurir Terdekat</h2>
            <p className="text-sm text-gray-500 mb-4">
              Drop Point: {selectedOrder.pickupLocation.dropPointName}
            </p>
            
            <div className="space-y-3">
              {couriers.map((courier) => (
                <div 
                  key={courier._id}
                  className={`p-4 border rounded-lg ${
                    courier.status === 'free' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{courier.name}</p>
                      <p className="text-sm text-gray-600">
                        {courier.courierInfo.vehicleType === 'motorcycle' ? '🛵' : '🚗'} 
                        {' '}{courier.courierInfo.vehicleNumber}
                      </p>
                      {courier.distance !== null && (
                        <p className="text-xs text-blue-600 font-medium">
                          📍 {courier.distance} km dari lokasi
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        courier.status === 'free' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {courier.statusLabel}
                      </span>
                      {courier.status === 'free' && (
                        <button
                          onClick={() => handleAssign(courier._id)}
                          disabled={assigning === courier._id}
                          className="mt-2 block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {assigning === courier._id ? (
                            <Loader2Icon className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            "Assign"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}