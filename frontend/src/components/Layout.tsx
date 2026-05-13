import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream bg-opacity-30">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto py-8 px-4 md:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
