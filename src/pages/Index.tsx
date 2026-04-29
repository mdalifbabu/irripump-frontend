// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 0 0 3 5.5v2.879a2.5 2.5 0 0 0 .732 1.767l6.5 6.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-6.5-6.5A2.5 2.5 0 0 0 8.38 3H5.5zM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প</h1>
              <p className="text-sm text-muted-foreground">Alhaj Yeaqub Ali Irrigation Pump Management</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Welcome to Irrigation Management System
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Digitizing irrigation services for farmers in Bangladesh
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <a href="/auth" className="group">
              <div className="p-6 bg-card rounded-xl border border-border hover:border-primary transition-all shadow-sm hover:shadow-md">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Admin & Users</h3>
                <p className="text-sm text-muted-foreground">Manage pumps, users, and farmers</p>
              </div>
            </a>

            <a href="/farmer" className="group">
              <div className="p-6 bg-card rounded-xl border border-border hover:border-accent transition-all shadow-sm hover:shadow-md">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Farmer Portal</h3>
                <p className="text-sm text-muted-foreground">ফার্মার কোড দিয়ে প্রবেশ করুন</p>
              </div>
            </a>

            <a href="/auth" className="group">
              <div className="p-6 bg-card rounded-xl border border-border hover:border-success transition-all shadow-sm hover:shadow-md">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-success group-hover:text-success-foreground transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                <p className="text-sm text-muted-foreground">Login or create an account</p>
              </div>
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
