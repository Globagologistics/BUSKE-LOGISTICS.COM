import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Package,
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  Search,
  Plane,
  Ship,
} from "lucide-react";
import ShipmentProgressBar from "../components/ShipmentProgressBar";
import { Badge } from "../components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "../components/ui/carousel";
import { calculateCheckpointTimes, calculateProgressPercentage, isFlightShipment } from "../utils/trackingUtils";
import { StarRating } from "../components/StarRating";
import { useShipmentWithCheckpoints } from "../../hooks/useSupabase";

// Calculate countdown progress (returns elapsed percentage 0-100)
// durationHours should be the number of hours the countdown is set for.
const calculateCountdownProgress = (startTime: string, durationHours: number): number => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsed = now - start;
  const totalDuration = durationHours * 3600 * 1000; // convert hours to ms

  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;

  // Return elapsed percentage (0 to 100)
  return Math.round((elapsed / totalDuration) * 100);
};

// Format remaining countdown time (duration is provided in hours)
const formatCountdownTime = (startTime: string, durationHours: number): string => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const remaining = (durationHours * 3600 * 1000) - (now - start);

  if (remaining <= 0) return 'Completed';

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};

export default function TrackShipment() {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [isTracking, setIsTracking] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0); // Force re-render every second
  const [routeMapLoading, setRouteMapLoading] = useState(true);
  const [routeMapError, setRouteMapError] = useState(false);

  // Fetch shipment from Supabase with real-time updates
  const { shipment, loading } = useShipmentWithCheckpoints(trackingId || '');

  // 6-second timeout for route map loading
  useEffect(() => {
    if (shipmentData) {
      setRouteMapLoading(true);
      setRouteMapError(false);
      const timer = setTimeout(() => {
        setRouteMapLoading(false);
        setRouteMapError(true);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [shipmentData?.id]);

  useEffect(() => {
    if (searchParams.get("id")) {
      setTrackingId(searchParams.get("id") || "");
    }
  }, [searchParams]);

  // Update tracking display - every second if countdown timer exists
  useEffect(() => {
    if (!shipmentData?.countdownDuration || shipmentData?.stopped || shipmentData?.paused) return;
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [shipmentData?.countdownDuration, shipmentData?.stopped, shipmentData?.paused]);

  const deriveData = (found: any) => {
    // Transform database shipment to display format
    const isFlightShip = isFlightShipment(found.transportation_type);
    const enhancedCheckpoints = calculateCheckpointTimes(
      found.checkpoints || [],
      null,
      null,
      isFlightShip
    );

    // Calculate progress based on countdown timer if available
    let progress = 0;
    const hours = found.countdown_duration ? found.countdown_duration / 3600 : 0;
    if (hours > 0 && found.countdown_start_time && !found.paused && !found.stopped) {
      progress = calculateCountdownProgress(found.countdown_start_time, hours);
      console.log('⏱️ Countdown Progress calculated:', {
        startTime: found.countdown_start_time,
        durationHours: hours,
        progressPercent: progress,
        remaining: formatCountdownTime(found.countdown_start_time, hours),
      });
    } else if (found.paused) {
      // If paused, return current progress
      progress = calculateCountdownProgress(found.countdown_start_time, hours);
    } else if (found.stopped) {
      // When stopped, freeze progress at the moment it was stopped (use stop_timestamp if available)
      try {
        if (found.stop_timestamp) {
          const stopTime = new Date(found.stop_timestamp).getTime();
          const start = new Date(found.countdown_start_time).getTime();
          const totalDurationMs = hours * 3600 * 1000;
          const elapsed = Math.max(0, Math.min(totalDurationMs, stopTime - start));
          progress = Math.round((elapsed / totalDurationMs) * 100) || 0;
        } else {
          // Fallback to current elapsed percentage if stop timestamp isn't present
          progress = calculateCountdownProgress(found.countdown_start_time, hours);
        }
      } catch (e) {
        progress = calculateCountdownProgress(found.countdown_start_time, hours);
      }
    }

    setShipmentData({
      ...found,
      trackingId: found.id,
      status: found.stopped
        ? 'Stopped'
        : found.paused
        ? 'Paused'
        : 'In Transit',
      stopReason: found.stop_reason || '',
      progress,
      transportMode: found.transportation_type,
      origin: found.pickup_location,
      destination: found.delivery_address,
      vehicle: found.vehicle_type,
      driver: found.driver_name,
      driverImage: found.driver_image_url,
      driverExperience: found.driver_experience,
      senderName: found.sender_name,
      senderPhone: found.sender_phone,
      receiverName: found.receiver_name,
      receiverPhone: found.receiver_phone,
      pickupLocation: found.pickup_location,
      packageName: found.package_name,
      cost: found.cost,
      images: found.images || [],
      departureTime: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
      currentLocation:
        enhancedCheckpoints.find((c: any) => c.status === 'current')?.location ||
        enhancedCheckpoints[0]?.location ||
        '',
      // Calculate fixed percent positions for each milestone along the progress bar
      checkpoints: (() => {
        const arr = (enhancedCheckpoints || []).map((cp: any, idx: number, all: any[]) => {
          const positionPercent = Math.round(((idx + 1) / (all.length + 1)) * 100);
          let status = cp.status;
          if (hours > 0) {
            if (progress >= positionPercent) status = 'completed';
            else if (progress >= positionPercent - Math.max(5, Math.round(100 / (all.length + 1) / 2))) status = 'current';
            else status = 'pending';
          }
          return { ...cp, positionPercent, status };
        });

        // If shipment stopped, mark the next pending milestone as 'stopped' to highlight it
        if (found.stopped) {
          const nextPending = arr.findIndex((c: any) => c.status === 'pending');
          if (nextPending !== -1) {
            arr[nextPending].status = 'stopped';
          }
        }

        return arr;
      })(),
      isFlightShipment: isFlightShip,
      countdownDuration: hours,
      countdownStartTime: found.countdown_start_time,
      paused: found.paused,
      stopped: found.stopped,
    });
    console.log('📦 Shipment data updated, progress:', progress);
  };

  // Transform Supabase shipment data when it arrives
  useEffect(() => {
    if (shipment) {
      deriveData(shipment);
    }
  }, [shipment, updateTrigger]);

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    setIsTracking(true);
    // The hook will automatically fetch when trackingId changes
    setShipmentData(null); // Clear previous search results
    setTimeout(() => setIsTracking(false), 500); // Simulate loading
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "Air Freight":
        return Plane;
      case "Ocean Cargo":
        return Ship;
      default:
        return Truck;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 relative overflow-hidden">
      <img
        src="https://kvgloballogistics.com/wp-content/uploads/2024/05/tracking-kvgll.jpg"
        alt="tracking background"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
            Track Your Shipment
          </h1>
          <p className="text-xl text-gray-600">
            Real-time tracking across the globe
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="relative"
          >
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter Tracking ID (e.g. GG-2026-001)"
                  className="w-full sm:flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-gray-900 placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isTracking ? (
                    <>Tracking...</>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Track
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Tracking Results */}
        {shipmentData && shipmentData.notFound && (
          <div className="text-center text-red-600">
            No shipment found with that tracking ID.
          </div>
        )}
        {shipmentData && !shipmentData.notFound && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className={`rounded-2xl p-8 shadow-lg border-2 transition-all ${
              shipmentData.status === 'Stopped'
                ? 'bg-red-50 border-red-500'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className={`text-2xl font-bold ${
                      shipmentData.status === 'Stopped' ? 'text-red-700' : 'text-[#0F1F3D]'
                    }`}>
                      {shipmentData.trackingId}
                    </h2>
                    <Badge className={`text-white border-0 ${
                      shipmentData.status === 'Stopped'
                        ? 'bg-red-600'
                        : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8]'
                    }`}>
                      {shipmentData.status}
                    </Badge>
                  </div>
                  <p className={shipmentData.status === 'Stopped' ? 'text-red-600' : 'text-gray-600'}>
                    {shipmentData.origin} → {shipmentData.destination}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getTransportIcon(shipmentData.transportMode);
                    return (
                      <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${
                        shipmentData.status === 'Stopped'
                          ? 'bg-red-100 border-red-300'
                          : 'bg-gradient-to-r from-[#2563EB]/10 to-[#38BDF8]/10 border-[#2563EB]/20'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          shipmentData.status === 'Stopped' ? 'text-red-600' : 'text-[#2563EB]'
                        }`} />
                        <span className={`font-medium ${
                          shipmentData.status === 'Stopped' ? 'text-red-700' : 'text-[#0F1F3D]'
                        }`}>
                          {shipmentData.transportMode}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {shipmentData.status === 'Stopped' && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700 font-semibold mb-3">⚠️ This shipment has been stopped!</p>
                  <a
                    href="https://wa.me/13364596552?text=Hello%20I%20need%20assistance%20with%20my%20shipment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
                  >
                    📞 Contact Customer Service (WhatsApp)
                  </a>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <ShipmentProgressBar
                  progress={shipmentData.progress}
                  transportMode={shipmentData.transportMode}
                  checkpoints={shipmentData.checkpoints}
                  status={shipmentData.status}
                  vehiclesCount={shipmentData.vehiclesCount || 1}
                />
                {/* Countdown Timer Display */}
                {shipmentData.countdownDuration && shipmentData.countdownStartTime && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-700">⏱️ Countdown Timer</span>
                      <span className="text-sm font-bold text-orange-600">
                        {formatCountdownTime(shipmentData.countdownStartTime, shipmentData.countdownDuration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Images Carousel Section */}
            {shipmentData.images && shipmentData.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[#0F1F3D] flex items-center gap-3">
                    📦 Product Images
                  </h3>
                  <div className="relative px-2">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {shipmentData.images.map((imageUrl: string, index: number) => (
                          <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-48 sm:h-56"
                            >
                              <img
                                src={imageUrl}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                <span className="text-white text-sm font-medium bg-black/50 px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {index + 1} / {shipmentData.images.length}
                                </span>
                              </div>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {shipmentData.images.length > 1 && (
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Placeholder */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full">
                  <h3 className="text-xl font-semibold text-[#0F1F3D] mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#2563EB]" />
                    Live Route Map
                  </h3>
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* Default blurred map image background */}
                    <img
                      src="https://lh3.googleusercontent.com/L_8R6GVq0cG0LYJCA-9QgRXmftttFrigL6iBV35Ca37UEBioMCoRguAaB-UPFFXNl_RllSrnuSqgsAgEZ1QCvubkoKgP8Lfqjc4QpOs=w450"
                      alt="Default map"
                      className="absolute inset-0 w-full h-full object-cover blur-sm"
                    />
                    {/* Current location overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-[#2563EB] mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[#0F1F3D] bg-white/80 px-3 py-2 rounded-lg backdrop-blur-sm">
                          Current: {shipmentData?.currentLocation || 'Loading...'}
                        </p>
                      </div>
                    </div>

                    {/* Route screenshot if available */}
                    {shipmentData?.routeScreenshot && (
                      <img
                        src={shipmentData.routeScreenshot}
                        alt="Route map"
                        className="absolute inset-0 w-full h-full object-cover z-20"
                        onLoad={() => {
                          setRouteMapLoading(false);
                          setRouteMapError(false);
                        }}
                      />
                    )}

                    {/* Loading spinner */}
                    {routeMapLoading && !shipmentData?.routeScreenshot && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
                          <p className="text-white font-medium text-sm">Loading map...</p>
                        </div>
                      </div>
                    )}

                    {/* Error message after 6 seconds */}
                    {routeMapError && !shipmentData?.routeScreenshot && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-sm">
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">⚠️</span>
                          </div>
                          <p className="text-white font-semibold mb-2">Error loading live route</p>
                          <p className="text-white/80 text-sm">Please try again</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-[#0F1F3D] mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#2563EB]" />
                    Shipment Details
                  </h3>
                  <div className="space-y-5">
                    {/* Package Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">📦 Package Information</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Package Name</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.packageName || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Cost</div>
                          <div className="font-medium text-[#10B981]">${shipmentData.cost?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Sender Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">👤 Sender</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Name</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.senderName || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Phone</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.senderPhone || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">📍 Pickup Location</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.pickupLocation || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Receiver Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">📬 Receiver</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Name</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.receiverName || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Phone</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.receiverPhone || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Information */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">⏱️ Timeline</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                          <div className="font-medium text-[#0F1F3D] text-sm">{shipmentData.departureTime}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Estimated Arrival</div>
                          <div className="font-medium text-[#10B981]">{shipmentData.estimatedArrival || 'Based on countdown'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Logistics Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-[#0F1F3D] mb-3">🚚 Logistics</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Vehicle Type</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.vehicle || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Driver/Pilot</div>
                          <div className="font-medium text-[#0F1F3D]">{shipmentData.driver || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">📧</span>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Email Notifications</h4>
                      <p className="text-xs text-blue-800">As soon as the package gets close to its destination or runs into any issue, an email will be sent to both the sender and receiver for clearance, pickup, and delivery updates.</p>
                    </div>
                  </div>
                </div>

                {shipmentData.driverImage && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                    <h3 className="text-sm sm:text-lg font-semibold text-[#0F1F3D] mb-4">
                      🚗 Your Driver
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={shipmentData.driverImage}
                          alt={shipmentData.driver}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-md flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base text-[#0F1F3D]">{shipmentData.driver}</p>
                          {shipmentData.driverExperience && (
                            <div className="mt-2">
                              <StarRating experience={shipmentData.driverExperience} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checkpoint Timeline */}
            <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-[#0F1F3D] mb-6 sm:mb-8 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2563EB]" />
                Tracking Timeline ({shipmentData.checkpoints.length} Milestones)
              </h3>

              {/* Scrollable location cards container - Vertical scroll */}
              <div className="max-h-96 overflow-y-auto pb-4">
                <div className="flex flex-col gap-4">
                  {shipmentData.checkpoints.map((checkpoint: any, index: number) => {
                    const isCompleted = checkpoint.status === 'completed';
                    const isCurrent = checkpoint.status === 'current';
                    const isPending = checkpoint.status === 'pending';
                    const isStopped = checkpoint.status === 'stopped';

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`rounded-xl p-5 transition-all border-2 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md hover:shadow-lg'
                            : isCurrent
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-lg hover:shadow-xl scale-105'
                            : isStopped
                            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 shadow-md hover:shadow-lg'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Top Row: Icon + Location + Badge */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          {/* Status Icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-500 text-white'
                              : isStopped
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-7 h-7" />
                            ) : isCurrent ? (
                              <Package className="w-7 h-7 animate-pulse" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Location Name */}
                          <div className="flex-1">
                            <h4 className={`font-bold text-lg break-words ${
                                isCompleted
                                  ? 'text-green-700'
                                  : isCurrent
                                  ? 'text-blue-700'
                                  : isStopped
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }`}>
                              {checkpoint.location}
                            </h4>
                          </div>

                          {/* Status Badge */}
                          <Badge className={`flex-shrink-0 text-xs font-semibold whitespace-nowrap ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white'
                              : isStopped
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {isCompleted
                              ? '✓ Passed'
                              : isCurrent
                              ? '📍 Current'
                              : isStopped
                              ? '⚠ Stopped'
                              : '⏱ Soon'}
                          </Badge>
                        </div>

                        {/* Bottom Row: Time Info */}
                        <div className={`text-sm font-medium ${
                          isCompleted
                            ? 'text-green-600'
                            : isCurrent
                            ? 'text-blue-600'
                            : isStopped
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {isCompleted && checkpoint.passedAgo && (
                              <span>Passed {checkpoint.passedAgo}</span>
                            )}
                            {isCurrent && (
                              <span>Currently at this location</span>
                            )}
                            {isStopped && (
                              <span>Stopped — contact support</span>
                            )}
                            {isPending && checkpoint.timeUntilPass && (
                              <span>Expected {checkpoint.timeUntilPass}</span>
                            )}
                            {isPending && !checkpoint.timeUntilPass && (
                              <span>Awaiting arrival</span>
                            )}
                          </div>
                        </div>

                        {/* Checkpoint Index */}
                        <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs opacity-60">
                          Milestone {index + 1} of {shipmentData.checkpoints.length}
                        </div>
                        {isStopped && (
                          <div className="mt-3">
                            <a
                              href="https://wa.me/13364596552?text=Hello%20I%20need%20assistance%20with%20my%20shipment"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-2 bg-red-600 text-white rounded-md text-sm"
                            >
                              Contact Support (WhatsApp)
                            </a>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!shipmentData && !isTracking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s"
              alt="Buske Logistics logo"
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-6 shadow-xl"
            />
            <h3 className="text-2xl font-semibold text-[#0F1F3D] mb-3">
              Enter a tracking ID to get started
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Track your shipment in real-time and get detailed information about its journey
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
