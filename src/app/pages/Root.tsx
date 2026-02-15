import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AdminProvider } from "../contexts/AdminContext";
import { FloatingWhatsAppButton } from "../components/FloatingWhatsAppButton";

export default function Root() {
  return (
    <AdminProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20">
          <Outlet />
        </main>
        <Footer />
        <FloatingWhatsAppButton />
      </div>
    </AdminProvider>
  );
}
