const TermsPage = () => {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: May 14, 2026</p>
        </div>
        <div className="text-gray-700 space-y-6 leading-relaxed">
          <p>
            Welcome to ZenPoll. By accessing or using our website and services, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By registering for an account or using our platform to create or vote on polls, you agree to these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. User Conduct</h2>
          <p>
            You agree not to use ZenPoll for any unlawful purpose or in any way that violates these terms. This includes, but is not limited to, creating polls that are offensive, discriminatory, or intended to harass others. You are responsible for all activity that occurs under your account.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Content Ownership</h2>
          <p>
            You retain ownership of the content you create on ZenPoll. However, by creating public polls, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your polls and their results.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time, with or without cause, if we believe you have violated these Terms of Service.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Disclaimer of Warranties</h2>
          <p>
            ZenPoll is provided "as is" without any warranties of any kind. We do not guarantee that the platform will be error-free or uninterrupted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
