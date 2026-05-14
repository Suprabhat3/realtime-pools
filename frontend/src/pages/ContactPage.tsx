const ContactPage = () => {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600">We'd love to hear from you. Please fill out the form below.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Name</label>
              <input 
                type="text" 
                placeholder="Your name" 
                className="w-full border border-red-100 rounded-lg p-3 focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Email</label>
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="w-full border border-red-100 rounded-lg p-3 focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Message</label>
              <textarea 
                placeholder="How can we help you?" 
                className="w-full border border-red-100 rounded-lg p-3 h-32 resize-none focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
              />
            </div>
            <button className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-3.5 font-bold tracking-widest uppercase text-sm rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
              SEND MESSAGE
            </button>
          </div>

          <div className="md:w-1/3 flex flex-col gap-8">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Email Us</h3>
              <p className="text-gray-600">suprabhat.work@gmail.com</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Follow Us</h3>
              <div className="flex gap-4 mt-2">
                <a href="https://x.com/suprabhat_3" target="_blank" className="text-gray-400 hover:text-brand-crimson transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="https://github.com/suprabhat3" target="_blank" className="text-gray-400 hover:text-brand-crimson transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
                <a href="https://new.suprabhat.site" target="_blank" className="text-gray-400 hover:text-brand-crimson transition-colors" aria-label="Portfolio">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
