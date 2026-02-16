import { Link, useNavigate } from "react-router";
import { useContext, useState, useEffect } from "react";
import { Package, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { AdminContext } from "../contexts/AdminContext";

export function Footer() {
  const navigate = useNavigate();
  const { unlockAdmin } = useContext(AdminContext);
  const [clicks, setClicks] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      // store on window so other components can use it too
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    // If already saved by another component, pick it up
    const existing = (window as any).deferredPWAInstallPrompt;
    if (existing) {
      setDeferredPrompt(existing);
      setShowInstall(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleCopyright = () => {
    setClicks((c) => {
      const next = c + 1;
      if (next === 5) {
        unlockAdmin();
        navigate('/admin');
      }
      return next;
    });
  };

  return (
    <footer className="bg-gradient-to-b from-[#0B1220] to-[#0F1F3D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img
                src="%BASE_URL%assets/images/buske-logo.jpeg"
                alt="Buske Logistics logo"
                className="w-12 h-12 rounded-full object-cover shadow-lg"
              />
              <div>
                <div className="font-bold text-xl">Buske Logistics</div>
                <div className="text-xs text-gray-400">
                  Your Trusted Global Logistics Partner
                </div>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Connecting the world through reliable, fast, and secure logistics solutions since 1998.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  aria-label={['Facebook','Twitter','LinkedIn','Instagram'][index]}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Track Shipment", path: "/track" },
                { name: "About Us", path: "/about" },
                { name: "Services", path: "/#services" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Our Services</h3>
            <ul className="space-y-3">
              {[
                "Air Freight",
                "Ocean Cargo",
                "Land Transport",
                "Door-to-Door Delivery",
              ].map((service) => (
                <li key={service}>
                  <span className="text-gray-400 text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  buskelogistics141@gmail.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  +1(336)4596552
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  #7 Gateway Commerce Center Dr. W, Suite 7, Edwardsville, IL 62025
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Buske Logistics. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </a>
              {showInstall && (
                <button
                  onClick={async () => {
                    const evt = deferredPrompt || (window as any).deferredPWAInstallPrompt;
                    if (!evt) return;
                    evt.prompt();
                    const choice = await evt.userChoice;
                    setShowInstall(false);
                    // clear stored event
                    try { delete (window as any).deferredPWAInstallPrompt; } catch {}
                  }}
                  className="text-gray-200 bg-white/6 hover:bg-white/10 px-3 py-2 rounded text-sm"
                >
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
