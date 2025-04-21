import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { Routes, Route, Navigate } from "react-router-dom";

import Topbar from "./pages/layouts/Topbar";
import Sidebar from "./pages/layouts/Sidebar";
import AccessibilitySidebar from "./pages/layouts/SidebarAccesibility";

import Dashboard from "./pages/dashboard";
import Team from "./pages/team";
import Products from "./pages/products";
import Providers from "./pages/providers";
import Profile from "./pages/profile";
import CreateUser from "./pages/createUser";
import Login from "./pages/login";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const [theme, ColorMode] = useMode();

  return (
    <ColorModeContext.Provider value={ColorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
           {/* Layout general para rutas privadas */}
         <Route
           path="/*"
           element={
             <PrivateRoute>
               <div className="app">
                 <Sidebar />
                 <main className="content">
                   <Topbar />
                   <Routes>
                     <Route path="/"           element={<Navigate to="/dashboard" />} />
                     <Route path="/dashboard"  element={<Dashboard />} />
                     <Route path="/team"       element={<Team />} />
                     <Route path="/products"   element={<Products />} />
                     <Route path="/providers"  element={<Providers />} />
                     <Route path="/createUser" element={<CreateUser />} />
                     <Route path="/profile"    element={<Profile />} />
                   </Routes>
                 </main>
                 <AccessibilitySidebar />
               </div>
             </PrivateRoute>
           }
         />
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
