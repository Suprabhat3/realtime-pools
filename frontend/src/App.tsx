import BackgroundElements from "./components/BackgroundElements";
import Header from "./components/Header";
import Hero from "./components/Hero";
import TrendingPolls from "./components/TrendingPolls";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import CallToAction from "./components/CallToAction";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <BackgroundElements />
      <Header />
      <Hero />
      <TrendingPolls />
      <HowItWorks />
      <Features />
      <CallToAction />
      <Footer />
    </div>
  );
}

export default App;
