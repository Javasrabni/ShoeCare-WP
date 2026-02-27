// /components/orders/OrderDetailModal.tsx - Modal detail dengan proof viewer
'use client';

import { XIcon, MapPinIcon, PhoneIcon, UserIcon, PackageIcon, ClockIcon } from 'lucide-react';
import PickupProofViewer from './PickupProofViewer';

interface OrderDetailModalProps {
  order: any;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Order</h2>
            <p className="text-sm text-gray-500 font-mono">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-medium mb-1">Status Saat Ini</p>
            <p className="text-lg font-bold text-gray-900">{order.currentStage}</p>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserIcon size={18} className="text-gray-400" />
              Info Customer
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <PhoneIcon size={14} />
                {order.customerPhone}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                <MapPinIcon size={14} className="mt-0.5 shrink-0" />
                {order.pickupAddress}
              </div>
            </div>
          </div>

          {/* Courier Info */}
          {order.courier && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <PackageIcon size={18} className="text-gray-400" />
                Info Kurir
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">{order.courier.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <PhoneIcon size={14} />
                  {order.courier.phone}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {order.courier.vehicleNumber}
                </p>
              </div>
            </div>
          )}

          {/* Pickup Proof */}
          {order.hasPickupProof && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Bukti Penjemputan</h3>
              <PickupProofViewer
                orderId={order._id}
                imageUrl={order.pickupProofImage}
                timestamp={order.pickupProofTimestamp}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}