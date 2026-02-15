import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import * as shipmentService from '../../services/shipmentService';
import { StarRating } from '../components/StarRating';
import { calculateProgressPercentage } from '../utils/trackingUtils';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipment, loading } = useShipmentWithCheckpoints(id || '');
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [routeMapLoading, setRouteMapLoading] = useState(true);
  const [routeMapError, setRouteMapError] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 6-second timeout for route map loading
  useEffect(() => {
    if (shipment) {
      setRouteMapLoading(true);
      setRouteMapError(false);
      const timer = setTimeout(() => {
        setRouteMapLoading(false);
        setRouteMapError(true);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [shipment?.id]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">Loading shipment...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">Shipment not found.</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const handleProgressClick = async (index: number) => {
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, { current_checkpoint_index: index });
    } catch (error) {
      console.error('Error updating checkpoint:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    setIsSaving(true);
    try {
      if (!shipment.paused) {
        // Pausing
        await shipmentService.updateShipment(shipment.id, {
          paused: true,
          pause_timestamp: new Date().toISOString(),
        });
      } else {
        // Resuming
        if (shipment.pause_timestamp && shipment.countdown_start_time) {
          const pauseTime = new Date(shipment.pause_timestamp).getTime();
          const startTime = new Date(shipment.countdown_start_time).getTime();
          const now = Date.now();
          const pausedDuration = now - pauseTime;
          const newStartTime = new Date(startTime + pausedDuration).toISOString();
          await shipmentService.updateShipment(shipment.id, {
            paused: false,
            countdown_start_time: newStartTime,
            pause_timestamp: undefined,
          } as any);
        } else {
          await shipmentService.updateShipment(shipment.id, {
            paused: false,
            pause_timestamp: undefined,
          } as any);
        }
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const handleStopConfirm = async () => {
    if (!stopReason.trim()) return;
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, {
        stopped: true,
        stop_reason: stopReason.trim(),
        status: 'stopped',
      });
      setShowStopModal(false);
      setStopReason('');
    } catch (error) {
      console.error('Error stopping shipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = async () => {
    setIsSaving(true);
    try {
      await shipmentService.updateShipment(shipment.id, {
        stopped: false,
        stop_reason: undefined,
        paused: false,
        status: 'in_transit',
      } as any);
    } catch (error) {
      console.error('Error resuming shipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <button
        onClick={() => navigate('/admin')}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        ← Back to dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {shipment.package_name || 'Shipment Details'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p>
            <strong>Sender:</strong> {shipment.sender_name} ({shipment.sender_phone})
          </p>
          <p>
            <strong>Receiver:</strong> {shipment.receiver_name} ({shipment.receiver_phone})
          </p>
          <p>
            <strong>Receiver Email:</strong> {shipment.receiver_email}
          </p>
          <p>
            <strong>Delivery Address:</strong> {shipment.delivery_address}
          </p>
          <p>
            <strong>Warehouse:</strong> {shipment.warehouse}
          </p>
          <p>
            <strong>Transportation:</strong> {shipment.transportation}
          </p>
          <p>
            <strong>Cost:</strong> ${shipment.cost?.toFixed(2) || '0.00'}{' '}
            {shipment.paid && '(paid)'}
          </p>
          {shipment.countdown_duration && shipment.countdown_start_time && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">
                ⏱️ Estimated Time to Arrival: {Math.floor(shipment.countdown_duration / 3600)} hours
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Countdown started: {new Date(shipment.countdown_start_time).toLocaleString()}
              </p>
              {/* time-based progress bar */}
              <div className="mt-2 relative w-full h-3 bg-gray-200 rounded">
                {/* eslint-disable-next-line */}
              <div
                  className="absolute top-0 left-0 h-full bg-green-500"
                  style={{
                    width: `${calculateProgressPercentage(
                      shipment.countdown_start_time,
                      new Date(
                        new Date(shipment.countdown_start_time).getTime() +
                          (shipment.countdown_duration || 0) * 1000
                      ).toISOString()
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div>
          {/* Product Images Carousel Section */}
          {shipment?.images && shipment.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 mb-4 p-4"
            >
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0F1F3D] flex items-center gap-2">
                  📦 Product Images
                </h3>
                <div className="relative px-2">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {shipment.images.map((imageUrl: string, index: number) => (
                        <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-40 sm:h-48"
                          >
                            <img
                              src={imageUrl}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                              <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {index + 1} / {shipment.images?.length}
                              </span>
                            </div>
                          </motion.div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {shipment.images.length > 1 && (
                      <>
                        <CarouselPrevious className="bg-white text-[#2563EB] hover:bg-gray-100" />
                        <CarouselNext className="bg-white text-[#2563EB] hover:bg-gray-100" />
                      </>
                    )}
                  </Carousel>
                </div>
              </div>
            </motion.div>
          )}

          {/* Live Route Map Section */}
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 mb-4 relative overflow-hidden aspect-video flex items-center justify-center">
            {/* Default blurred map image background */}
            <img
              src="https://lh3.googleusercontent.com/L_8R6GVq0cG0LYJCA-9QgRXmftttFrigL6iBV35Ca37UEBioMCoRguAaB-UPFFXNl_RllSrnuSqgsAgEZ1QCvubkoKgP8Lfqjc4QpOs=w450"
              alt="Default map"
              className="absolute inset-0 w-full h-full object-cover blur-sm"
            />

            {/* Current location overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-[#2563EB] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#0F1F3D] bg-white/80 px-3 py-2 rounded-lg backdrop-blur-sm">
                  Current: {shipment?.delivery_address || 'Loading...'}
                </p>
              </div>
            </div>

            {/* Route screenshot if available */}
            {shipment?.route_screenshot_url && (
              <img
                src={shipment.route_screenshot_url}
                alt="Route map"
                className="absolute inset-0 w-full h-full object-cover z-20"
                onLoad={() => {
                  setRouteMapLoading(false);
                  setRouteMapError(false);
                }}
              />
            )}

            {/* Loading spinner */}
            {routeMapLoading && !shipment?.route_screenshot_url && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
                  <p className="text-white font-medium text-sm">Loading map...</p>
                </div>
              </div>
            )}

            {/* Error message after 6 seconds */}
            {routeMapError && !shipment?.route_screenshot_url && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <p className="text-white font-semibold mb-1">Error loading live route</p>
                  <p className="text-white/80 text-xs">Please try again</p>
                </div>
              </div>
            )}
          </div>

          {/* display package images uploaded to storage */}
          {shipment.images && shipment.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {shipment.images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Package ${idx + 1}`}
                  className="w-full h-auto rounded"
                />
              ))}
            </div>
          )}

          {shipment.vehicles_count !== undefined && (
            <p>
              <strong>Vehicles:</strong> {shipment.vehicles_count} {shipment.vehicle_type}
            </p>
          )}
          {shipment.driver_name && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                {shipment.driver_image_url && (
                  <img
                    src={shipment.driver_image_url}
                    alt="Driver"
                    className="w-16 h-16 object-cover rounded-full shadow-md flex-shrink-0"
                  />
                )}
                <div>
                  <p className="font-semibold text-[#0F1F3D]">{shipment.driver_name}</p>
                  <StarRating experience={shipment.driver_experience} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {shipment.checkpoints && shipment.checkpoints.length > 0 && (
        <div className="mt-8">
          <div className="flex h-4 overflow-hidden rounded-lg bg-gray-200">
            {shipment.checkpoints.map((c: any, idx: number) => (
              <div
                key={c.id}
                className={`flex-1 cursor-pointer hover:bg-blue-300 transition-colors ${
                  idx <= (shipment.current_checkpoint_index || 0) ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                onClick={() => handleProgressClick(idx)}
                role="button"
                tabIndex={0}
                title={c.location}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4">
        {!shipment.stopped && (
          <>
            <button
              onClick={handlePauseToggle}
              disabled={isSaving}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md disabled:opacity-50"
            >
              {shipment.paused ? 'Play' : 'Pause'}
            </button>
            <button
              onClick={handleStop}
              disabled={shipment.stopped || isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
            >
              Stop
            </button>
          </>
        )}
        {shipment.stopped && (
          <button
            onClick={handleResume}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            Resume
          </button>
        )}
      </div>

      {shipment.stopped && (
        <p className="mt-4 text-red-600">Stopped: {shipment.stop_reason}</p>
      )}

      {/* Modern Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Stop Shipment</h2>
            <label className="block mb-2 text-sm font-medium">Reason for stopping:</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2 mb-4"
              value={stopReason}
              onChange={e => setStopReason(e.target.value)}
              placeholder="Enter reason..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStopModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleStopConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                disabled={!stopReason.trim() || isSaving}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
