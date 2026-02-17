import { Link, useNavigate } from "react-router";
import { useContext, useState, useEffect } from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
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
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
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

  const solutions = [
    'Warehousing',
    'Sequencing',
    'E-Commerce',
    'Value-Added Services',
    'B2B Fulfillment',
    'B2C Fulfillment',
    '3PL Solutions',
  ];

  const industries = [
    'Food & Beverage',
    'Aerospace & Defense',
    'Automotive',
    'Healthcare',
    'Industrials',
    'Retailers and Distributors',
    'Industries Served',
  ];

  const resources = [
    'Complete 3PL Guide',
    'Top 3PL Companies',
    '3PL Glossary',
    '3PL Pricing Guide',
    '3PL RFP Template',
    '3PL For Served Markets',
    'Partners Served',
  ];

  const aboutItems = [
    'About Buske',
    'Our Team',
    'In the News',
    'Careers',
    'Privacy Policy',
    'Warehouse Locations Served',
    '3PL Fulfillment Centers',
  ];

  return (
    <footer className="bg-gradient-to-b from-[#0B1220] to-[#0F1F3D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={import.meta.env.BASE_URL + 'assets/images/buske-logo.jpeg'}
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
            <p className="text-gray-400 text-xs leading-relaxed mb-3 font-medium">
              Your Trusted Global Partner
            </p>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Connecting the world through reliable, fast, and secure logistics solutions since 1998.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  aria-label={['Facebook','Twitter','LinkedIn','Instagram'][index]}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-2">
              {solutions.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Industries</h3>
            <ul className="space-y-2">
              {industries.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  buskelogistics141@gmail.com
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                <a href="tel:+13364596552" className="text-gray-500 hover:text-white text-xs transition-colors">+1(336)4596552</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
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
                <button onClick={async () => {
                  const evt = deferredPrompt || (window as any).deferredPWAInstallPrompt;
                  if (!evt) return;
                  evt.prompt();
                  const choice = await evt.userChoice;
                  setShowInstall(false);
                  try { delete (window as any).deferredPWAInstallPrompt; } catch {}
                }} className="text-gray-200 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs transition-colors">Install App</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
 
