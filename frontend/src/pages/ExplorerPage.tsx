import { useState } from "react";
const ExplorerPage = () => {
  const [activeCategory, setActiveCategory] = useState("All Topics");
  
  const categories = ["All Topics", "Technology", "Lifestyle", "Business", "Entertainment", "Politics", "Sports"];

  return (
    <div className="flex flex-col w-full text-gray-900 mt-4">
      <div className="flex flex-col gap-4 max-w-3xl mb-10">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">Explore Trends</h1>
        <p className="text-lg text-gray-600">Discover what the world is thinking. Vote on trending topics across technology, lifestyle, and more to see real-time insights.</p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3 mb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 text-sm font-semibold transition-colors border ${
              activeCategory === cat 
                ? 'bg-brand-crimson text-white border-brand-crimson shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-crimson hover:text-brand-crimson'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Polls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="col-span-full py-20 text-center text-gray-500 font-medium">
          No public polls are currently available. Check back later!
        </div>
      </div>

      <div className="flex justify-center mb-12">
        <button className="border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 text-xs font-bold tracking-widest uppercase px-8 py-3.5 transition-colors flex items-center gap-2 bg-white">
          LOAD MORE
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>

    </div>
  );
};

export default ExplorerPage;
