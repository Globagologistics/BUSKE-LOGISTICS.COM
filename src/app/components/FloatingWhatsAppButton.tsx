import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router';

export function FloatingWhatsAppButton() {
  const location = useLocation();

  // Hide on admin dashboard pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <motion.a
      href="https://wa.me/13364596552?text=Hello%20I%20need%20assistance%20with%20my%20shipment"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 transition-all duration-300"
      aria-label="Contact customer service on WhatsApp"
    >
      <div className="absolute inset-0 rounded-full bg-green-500 opacity-0 animate-pulse" />
      <MessageCircle className="w-7 h-7 text-white relative z-10" />
    </motion.a>
  );
}
