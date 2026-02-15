import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Home from "./pages/Home";
import TrackShipment from "./pages/TrackShipment";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { AdminRouteGuard } from "./pages/AdminRouteGuard";
import Admin from "./pages/Admin";
import AdminForm from "./pages/AdminForm";
import AdminDetail from "./pages/AdminDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "track", Component: TrackShipment },
      { path: "about", Component: About },
      { path: "signin", Component: SignIn },
      { path: "signup", Component: SignUp },
      {
        path: "admin",
        Component: AdminRouteGuard,
        children: [
          { index: true, Component: Admin },
          { path: "new", Component: AdminForm },
          { path: "edit/:id", Component: AdminForm },
          { path: "view/:id", Component: AdminDetail },
        ],
      },
      { path: "*", Component: Home },
    ],
  },
], {
  basename: import.meta.env.PROD ? '/Globalgo/' : '/',
});
