import BackgroundElements from "./components/BackgroundElements";
import Header from "./components/Header";
import Hero from "./components/Hero";

function App() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <BackgroundElements />
      <Header />
      <Hero />
    </div>
  );
}

export default App;
