const PrivacyPage = () => {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: May 14, 2026</p>
        </div>
        <div className="text-gray-700 space-y-6 leading-relaxed">
          <p>
            At ZenPoll, we take your privacy seriously. This Privacy Policy outlines how we collect, use, and protect your information when you use our services.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when creating an account, participating in polls, or contacting support. This may include your email address, profile information, and poll responses. When you vote anonymously, we use browser fingerprinting to prevent duplicate votes without tying the response to your personal identity.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Information</h2>
          <p>
            The information we collect is used to provide, maintain, and improve our services. Specifically, we use it to authenticate users, facilitate poll creation and voting, ensure platform security, and communicate with you regarding updates or support inquiries.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share anonymous or aggregated poll data publicly. If a poll requires authentication, your vote may be visible in the results if the poll creator has configured it that way. We may also share information with third-party service providers that help us operate our platform.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can manage your account settings or contact us to exercise these rights.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via our Contact page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
