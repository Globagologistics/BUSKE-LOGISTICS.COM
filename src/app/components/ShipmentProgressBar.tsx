import { motion } from "motion/react";
import { Checkpoint } from "../../types/database";
import { Plane, Ship, Truck } from "lucide-react";

type ProgressCheckpoint = Omit<Checkpoint, "status"> & {
  positionPercent?: number;
  status?: "pending" | "current" | "completed" | "stopped";
};

interface ShipmentProgressBarProps {
  progress: number; // 0-100
  transportMode: string;
  checkpoints?: ProgressCheckpoint[];
  status?: string;
  vehiclesCount?: number;
  isVisuallyPaused?: boolean;
}

// Determine transport type from mode string
function getTransportType(mode: string): "land" | "air" | "sea" {
  const lowerMode = (mode || "").toLowerCase();

  if (lowerMode.includes("air") || lowerMode.includes("flight")) {
    return "air";
  }

  if (
    lowerMode.includes("sea") ||
    lowerMode.includes("ship") ||
    lowerMode.includes("ocean") ||
    lowerMode.includes("maritime")
  ) {
    return "sea";
  }

  // Default to land for truck, delivery, etc.
  return "land";
}

const transportMeta = {
  land: {
    icon: Truck,
    accent: "from-emerald-400 to-sky-400",
    bgClass:
      "bg-[url('https://i.pinimg.com/1200x/0c/a2/8b/0ca28ba7685e2662a0215ba2f9476f83.jpg')]",
  },
  air: {
    icon: Plane,
    accent: "from-sky-400 to-indigo-400",
    bgClass:
      "bg-[url('https://www.carbonbrief.org/wp-content/uploads/2021/06/Blue-sky-with-clouds-1550x804.jpg')]",
  },
  sea: {
    icon: Ship,
    accent: "from-cyan-400 to-blue-500",
    bgClass:
      "bg-[url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7mHgSyXIeP9UGxAndGf30Tf6rRRvrEmOIAQ&s')]",
  },
};

function MapProgressBar({
  progress,
  transportMode,
  checkpoints,
  status,
  isVisuallyPaused = false,
}: ShipmentProgressBarProps) {
  const transportType = getTransportType(transportMode);
  const meta = transportMeta[transportType];
  const VehicleIcon = meta.icon;
  const isStopped = String(status || "").toLowerCase() === "stopped";
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const lineBase = isStopped ? "bg-red-500/25" : "bg-white/15";
  const lineAccent = isStopped ? "from-red-400 to-red-500" : meta.accent;
  const markerBorder = isStopped ? "border-red-300/60" : "border-white/40";
  const vehicleBg = isStopped ? "bg-red-500" : "bg-white";
  const vehicleIcon = isStopped ? "text-white" : "text-slate-900";
  const dashedLineClass = isStopped
    ? "bg-[linear-gradient(to_right,rgba(248,113,113,0.7)_0_12px,transparent_12px_24px)]"
    : "bg-[linear-gradient(to_right,rgba(255,255,255,0.55)_0_12px,transparent_12px_24px)]";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
        <span>Route Progress</span>
        <span className="text-sm font-semibold tracking-normal text-white/90">
          {clampedProgress}%
        </span>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border ${
          isStopped ? "border-red-400/40" : "border-white/15"
        } bg-white/5 bg-cover bg-center p-6 backdrop-blur-xl ${meta.bgClass}`}
      >
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(120deg,rgba(255,255,255,0.15),transparent_55%)]" />

        <div className="relative">
          <div className="relative mx-4 h-24">
            <div
              className={`absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full ${lineBase}`}
            >
              <div
                className={`absolute inset-0 rounded-full opacity-70 ${dashedLineClass} bg-[length:24px_2px]`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${clampedProgress}%` }}
                transition={{
                  duration: isVisuallyPaused || isStopped ? 0 : 0.6,
                  ease: "easeInOut",
                }}
                className={`h-full rounded-full bg-gradient-to-r ${lineAccent} shadow-[0_0_25px_rgba(56,189,248,0.45)]`}
              />
            </div>

            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className={`h-4 w-4 rounded-full border-2 ${markerBorder} bg-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.6)]`}
              />
            </div>
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2">
              <div
                className={`h-4 w-4 rounded-full border-2 ${markerBorder} bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]`}
              />
            </div>

            {(checkpoints || []).map((cp: ProgressCheckpoint, i: number) => {
              const fallbackPosition = Math.round(
                ((i + 1) / ((checkpoints?.length || 0) + 1)) * 100,
              );
              const positionPercent =
                typeof cp.positionPercent === "number"
                  ? cp.positionPercent
                  : fallbackPosition;

              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ left: `${positionPercent}%` }}
                  transition={{ duration: 0 }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                >
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${
                      isVisuallyPaused
                        ? "border-white/30 bg-white/40"
                        : cp.status === "completed"
                        ? "border-emerald-200 bg-emerald-400"
                        : cp.status === "current"
                        ? "border-sky-200 bg-sky-400"
                        : cp.status === "stopped"
                        ? "border-red-200 bg-red-500"
                        : "border-white/30 bg-white/40"
                    }`}
                  />
                </motion.div>
              );
            })}

            <motion.div
              animate={{ left: `${clampedProgress}%` }}
              transition={{
                duration: isVisuallyPaused || isStopped ? 0 : 0.6,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${vehicleBg} shadow-[0_12px_24px_rgba(15,23,42,0.45)] ${
                  isVisuallyPaused ? "opacity-70" : ""
                }`}
              >
                <VehicleIcon className={`h-5 w-5 ${vehicleIcon}`} />
              </div>
            </motion.div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/50">
            <span>Origin</span>
            <span>Destination</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-white/60 text-center">
        {clampedProgress === 100
          ? "Delivery Complete"
          : `${clampedProgress}% of the route completed`}
      </div>
    </div>
  );
}

export default function ShipmentProgressBar(props: ShipmentProgressBarProps) {
  return <MapProgressBar {...props} />;
}
