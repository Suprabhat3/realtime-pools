const HelpPage = () => {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600">Find answers to common questions and learn how to use ZenPoll.</p>
        </div>
        <div className="text-gray-700 space-y-8 leading-relaxed">
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-2">How do I create a poll?</h3>
                <p>To create a poll, sign in to your account and click the "Create Poll" button. You can then add your question, options, and customize settings like visibility and duration.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Can I make my poll private?</h3>
                <p>Yes. When creating a poll, you can choose between "Public" (visible on the Explorer page) or "Private" (only accessible via direct link).</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Voting & Results</h2>
            <div className="space-y-4">
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Do I need an account to vote?</h3>
                <p>It depends on the poll. Some polls allow anonymous voting, while others require you to be signed in to ensure response integrity.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-2">How do I see the results?</h3>
                <p>Once you vote on a poll, you can view the real-time results. You can also view results for closed polls by visiting the poll's link.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-brand-cream bg-opacity-30 rounded-xl border border-brand-crimson/20 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
            <p className="mb-4">Our support team is always ready to assist you.</p>
            <a href="/contact" className="inline-block bg-brand-crimson text-white px-6 py-3 rounded-md font-bold tracking-wide hover:bg-brand-crimson-hover transition-colors">
              CONTACT SUPPORT
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HelpPage;
