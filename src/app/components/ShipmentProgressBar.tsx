import { Truck, Plane, Ship } from "lucide-react";
import { motion } from "motion/react";

interface ShipmentProgressBarProps {
  progress: number; // 0-100
  transportMode: string;
  checkpoints?: any[];
  status?: string;
  vehiclesCount?: number;
}

// Determine transport type from mode string
function getTransportType(mode: string): 'land' | 'air' | 'sea' {
  const lowerMode = (mode || '').toLowerCase();
  
  if (lowerMode.includes('air') || lowerMode.includes('flight')) {
    return 'air';
  }
  
  if (lowerMode.includes('sea') || lowerMode.includes('ship') || lowerMode.includes('ocean') || lowerMode.includes('maritime')) {
    return 'sea';
  }
  
  // Default to land for truck, delivery, etc.
  return 'land';
}

// Land Transport Progress Bar - Road with moving car
function LandProgressBar({ progress, checkpoints, status, vehiclesCount = 1 }: Omit<ShipmentProgressBarProps, 'transportMode'> & { vehiclesCount?: number }) {
  // Spread vehicles evenly vertically
  const carOffsets = Array.from({ length: vehiclesCount }, (_, i) => {
    if (vehiclesCount === 1) return '50%';
    return `${20 + (60 / (vehiclesCount - 1)) * i}%`;
  });
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm mb-3">
        <span className={status === 'Stopped' ? 'text-red-600 font-medium' : 'text-gray-600'}>Shipment Progress</span>
        <span className="text-xs font-bold text-[#2563EB]">{progress}%</span>
      </div>
      {/* Road-like progress bar */}
      <div className="relative w-full h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full shadow-md overflow-hidden border-2 border-gray-300">
        {/* Road markings (dashed lines) */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 absolute left-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #FBBF24 0px, #FBBF24 30px, transparent 30px, transparent 60px)',
              opacity: 0.7
            }}
          />
        </div>
        {/* Completed section */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-green-400 to-green-300 rounded-full shadow-lg"
        />
        {/* Multiple moving car icons */}
        {carOffsets.map((top, idx) => (
          <motion.div
            key={idx}
            animate={{ left: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute -translate-x-1/2"
            style={{ top }}
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', delay: idx * 0.1 }}
                className="text-3xl drop-shadow-lg"
              >
                🚗
              </motion.div>
              {/* Speed lines */}
              {progress > 0 && progress < 100 && (
                <>
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3], x: [-8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute -left-8 top-1/2 text-gray-400 text-lg"
                  >
                    ║
                  </motion.div>
                  <motion.div
                    animate={{ opacity: [0.2, 0.6, 0.2], x: [-16, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute -left-16 top-1/2 text-gray-300 text-lg"
                  >
                    ║
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        ))}
        {/* Checkpoint markers */}
        {(checkpoints || []).map((cp: any, i: number) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 pointer-events-none"
            style={{ left: `${cp.positionPercent}%` }}
          >
            <div
              className={`w-3 h-3 rounded-full shadow-md border border-white ${
                cp.status === 'completed'
                  ? 'bg-green-500'
                  : cp.status === 'current'
                  ? 'bg-blue-500'
                  : cp.status === 'stopped'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            />
          </div>
        ))}
      </div>
      {/* Progress text */}
      <div className="text-xs text-gray-500 text-center">
        {progress === 100 ? '✅ Delivery Complete' : `${progress}% of the way there`}
      </div>
    </div>
  );
}

// Air Transport Progress Bar - Sky with moving plane
function AirProgressBar({ progress, checkpoints, status }: Omit<ShipmentProgressBarProps, 'transportMode'>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm mb-3">
        <span className={status === 'Stopped' ? 'text-red-600 font-medium' : 'text-gray-600'}>Flight Progress</span>
        <span className="text-xs font-bold text-[#2563EB]">{progress}%</span>
      </div>

      {/* Sky-like progress bar */}
      <div className="relative w-full h-16 bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 rounded-full shadow-md overflow-hidden border-2 border-blue-200">
        {/* Cloud decorations */}
        <div className="absolute left-2 top-2 text-xl opacity-40">☁️</div>
        <div className="absolute right-4 bottom-2 text-xl opacity-30">☁️</div>

        {/* Sky completion gradient */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-sky-300 to-sky-200 rounded-full shadow-lg"
        />

        {/* Moving plane icon */}
        <motion.div
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        >
          <div className="relative">
            <motion.div
              animate={{ y: [0, -3, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              className="text-3xl drop-shadow-lg"
            >
              ✈️
            </motion.div>
            {/* Contrails behind the plane */}
            {progress > 0 && progress < 100 && (
              <>
                <motion.div
                  animate={{ opacity: [0.4, 0.2], x: [-4, -12] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -left-6 top-1/4 text-blue-300 text-sm"
                >
                  ~~
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.1], x: [-8, -20] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }}
                  className="absolute -left-10 top-2/3 text-blue-200 text-sm"
                >
                  ~~
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Checkpoint markers */}
        {(checkpoints || []).map((cp: any, i: number) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 pointer-events-none"
            style={{ left: `${cp.positionPercent}%` }}
          >
            <div
              className={`w-3 h-3 rounded-full shadow-md border border-white ${
                cp.status === 'completed'
                  ? 'bg-green-500'
                  : cp.status === 'current'
                  ? 'bg-blue-600'
                  : cp.status === 'stopped'
                  ? 'bg-red-500'
                  : 'bg-gray-300'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Progress text */}
      <div className="text-xs text-gray-500 text-center">
        {progress === 100 ? '✈️ Landing Complete' : `Cruising at altitude - ${progress}% enroute`}
      </div>
    </div>
  );
}

// Sea Transport Progress Bar - Ocean with moving ship
function SeaProgressBar({ progress, checkpoints, status }: Omit<ShipmentProgressBarProps, 'transportMode'>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm mb-3">
        <span className={status === 'Stopped' ? 'text-red-600 font-medium' : 'text-gray-600'}>Voyage Progress</span>
        <span className="text-xs font-bold text-[#2563EB]">{progress}%</span>
      </div>

      {/* Ocean-like progress bar */}
      <div className="relative w-full h-20 bg-gradient-to-r from-blue-200 via-cyan-100 to-blue-200 rounded-full shadow-md overflow-hidden border-2 border-blue-300">
        {/* Wave pattern background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="waves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
              <path d="M0,50 Q50,30 100,50 T200,50" stroke="#0369a1" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
          <rect width="1000" height="100" fill="url(#waves)" />
        </svg>

        {/* Water completion gradient */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-300 rounded-full shadow-lg relative"
        >
          {/* Water ripple effect */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="completedWaves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
                <path d="M0,50 Q50,35 100,50 T200,50" stroke="#ffffff" strokeWidth="1.5" fill="none" />
              </pattern>
            </defs>
            <rect width="1000" height="100" fill="url(#completedWaves)" />
          </svg>
        </motion.div>

        {/* Moving ship icon */}
        <motion.div
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
        >
          <div className="relative">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              className="text-3xl drop-shadow-lg"
            >
              🚢
            </motion.div>
            {/* Water splashes */}
            {progress > 0 && progress < 100 && (
              <>
                <motion.div
                  animate={{ opacity: [0.4, 0.1], y: [0, 10] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2 }}
                  className="absolute left-2 top-1/2 text-blue-400 text-xl"
                >
                  ∿
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.1], y: [0, 10] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.4 }}
                  className="absolute -right-2 top-1/2 text-blue-300 text-xl"
                >
                  ∿
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Checkpoint markers */}
        {(checkpoints || []).map((cp: any, i: number) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 pointer-events-none z-5"
            style={{ left: `${cp.positionPercent}%` }}
          >
            <div
              className={`w-3 h-3 rounded-full shadow-md border border-white ${
                cp.status === 'completed'
                  ? 'bg-green-500'
                  : cp.status === 'current'
                  ? 'bg-blue-600'
                  : cp.status === 'stopped'
                  ? 'bg-red-500'
                  : 'bg-gray-300'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Progress text */}
      <div className="text-xs text-gray-500 text-center">
        {progress === 100 ? '⚓ Port of Arrival Reached' : `Smooth sailing - ${progress}% of voyage complete`}
      </div>
    </div>
  );
}

// Main component that routes to the correct progress bar
export default function ShipmentProgressBar({
  progress,
  transportMode,
  checkpoints,
  status,
  vehiclesCount,
}: ShipmentProgressBarProps) {
  const transportType = getTransportType(transportMode);
  const commonProps = { progress, checkpoints, status };
  switch (transportType) {
    case 'air':
      return <AirProgressBar {...commonProps} />;
    case 'sea':
      return <SeaProgressBar {...commonProps} />;
    case 'land':
    default:
      return <LandProgressBar {...commonProps} vehiclesCount={vehiclesCount || 1} />;
  }
}
