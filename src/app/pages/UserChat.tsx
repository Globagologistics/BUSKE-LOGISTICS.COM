import React, { useEffect, useState } from "react";
import { ChatThread } from "../components/chat/ChatThread";
import { ensureChatThread, sendChatMessage } from "../../hooks/useChat";
import { useShipmentWithCheckpoints } from "../../hooks/useSupabase";

const AGENT_NAMES = [
  "Sarah Miller",
  "Jordan Smith",
  "Ashley Taylor",
  "David Wilson",
  "Maria Hernandez",
];
const ADMIN_AVATAR_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s";
const TYPING_SPEED_MS = 28;

export default function UserChat() {
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success">("info");
  const [agentTypingLabel, setAgentTypingLabel] = useState<string | null>(null);
  const { shipment, loading, error } = useShipmentWithCheckpoints(submittedId || "");

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (!submittedId) return;
    if (loading) return;

    if (shipment) {
      void ensureChatThread(submittedId);
      setActiveTrackingId(submittedId);
      setValidationError(null);
      setAlertNotice("Tracking ID verified");
      const timer = window.setTimeout(() => setAlertNotice(null), 2000);
      return () => window.clearTimeout(timer);
    }

    setActiveTrackingId(null);
    setValidationError(error || "Tracking ID not found. Please check and try again.");
  }, [submittedId, loading, shipment, error]);

  useEffect(() => {
    if (!activeTrackingId) return;
    let cancelled = false;
    let typingTimer: number | undefined;
    let statusTimer: number | undefined;
    let connectTimer: number | undefined;

    const setupAgent = async () => {
      const thread = await ensureChatThread(activeTrackingId);
      if (cancelled) return;

      const hasHistory = Boolean(thread?.lastMessageAt);
      const storageKey = `chat-agent-${activeTrackingId}`;
      const previousAgent = window.localStorage.getItem(storageKey);
      const available = AGENT_NAMES.filter((name) => name !== previousAgent);
      const nextAgent =
        available[Math.floor(Math.random() * available.length)] ||
        AGENT_NAMES[0];
      window.localStorage.setItem(storageKey, nextAgent);

      setStatusNotice("Connecting you to a live agent...");
      setStatusTone("info");
      setAgentTypingLabel(null);

      connectTimer = window.setTimeout(() => {
        setStatusNotice("Connected");
        setStatusTone("success");

        const messageText = hasHistory
          ? `Welcome back! This is ${nextAgent} from Buske Logistics customer care. How may we be of help today?`
          : `Hi, I'm ${nextAgent} from Buske Logistics customer care. How may we be of help today?`;

        const typingDuration = Math.min(
          5000,
          Math.max(1600, messageText.length * TYPING_SPEED_MS)
        );

        setAgentTypingLabel(`${nextAgent} is typing...`);
        void sendChatMessage({
          trackingId: activeTrackingId,
          sender: "admin",
          senderName: nextAgent,
          senderAvatarUrl: ADMIN_AVATAR_URL,
          text: messageText,
          animateTyping: true,
          typingSpeedMs: TYPING_SPEED_MS,
        });

        typingTimer = window.setTimeout(() => {
          setAgentTypingLabel(null);
        }, typingDuration);

        statusTimer = window.setTimeout(() => {
          setStatusNotice(null);
        }, 2500);
      }, 5000);
    };

    void setupAgent();

    return () => {
      cancelled = true;
      if (connectTimer) window.clearTimeout(connectTimer);
      if (typingTimer) window.clearTimeout(typingTimer);
      if (statusTimer) window.clearTimeout(statusTimer);
      setAgentTypingLabel(null);
    };
  }, [activeTrackingId]);

  const handleUnlock = () => {
    const value = trackingIdInput.trim();
    if (!value) return;
    setSubmittedId(value);
    setValidationError(null);
  };

  return (
    <div className="relative min-h-screen h-[100svh] w-full overflow-hidden bg-[#0B1220] text-white">
      <div className="absolute inset-0 bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg')] bg-cover bg-center opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(3,7,18,0.98)_0%,rgba(3,7,18,0.9)_45%,rgba(3,7,18,0.5)_70%,rgba(3,7,18,0)_90%)]" />

      <div className="relative z-10 flex h-full w-full flex-col">
        {!activeTrackingId ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-2xl">
              <h1 className="text-3xl font-black tracking-tighter">
                Enter Your Tracking ID
              </h1>
              <p className="mt-3 text-sm text-white/70">
                Access live shipment updates, delivery status, and real-time
                support.
              </p>
              <input
                value={trackingIdInput}
                onChange={(event) => setTrackingIdInput(event.target.value)}
                placeholder="e.g. TRK-2026-0042"
                className="mt-6 h-12 w-full rounded-full border border-white/20 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />
              {validationError && (
                <div className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                  {validationError}
                </div>
              )}
              <button
                type="button"
                onClick={handleUnlock}
                className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading && submittedId === trackingIdInput.trim()}
              >
                {loading && submittedId === trackingIdInput.trim()
                  ? "Verifying Tracking ID..."
                  : "Open Tracking Chat"}
              </button>
            </div>
          </div>
        ) : (
          <ChatThread
            trackingId={activeTrackingId}
            role="user"
            title="Shipment Command Line"
            subtitle="Live tracking support"
            accentClassName="bg-[#1E40AF]"
            alertNotice={alertNotice}
            statusNotice={statusNotice}
            statusTone={statusTone}
            agentTypingLabel={agentTypingLabel}
          />
        )}
      </div>
    </div>
  );
}
