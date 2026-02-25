import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const HomePage: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PC</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Phish-Chips</h1>
            </div>
            <nav>
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-foreground text-sm font-medium">
                      ✓ Signed in
                    </span>
                  </div>
                  <span className="text-muted-foreground font-medium">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-foreground hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user ? (
          <div className="bg-background border border-border rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome to your Dashboard!
              </h2>
              <p className="text-muted-foreground text-lg">
                You are successfully authenticated.
              </p>
            </div>

            {/* User Details Container */}
            <div className="bg-muted border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
                User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-foreground">
                      Email Address
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-foreground">User ID</span>
                  </div>
                  <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-foreground">
                      Account Created
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-foreground">
                      Last Sign In
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-background border border-border rounded-lg p-12">
              <div className="w-24 h-24 bg-black rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">PC</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Welcome to Phish-Chips!
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                A secure platform designed to protect you from phishing attacks
                and provide a safe digital experience.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-muted border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Secure Authentication
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Google OAuth and magic link protection
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Phishing Protection
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Advanced detection and prevention
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Easy Access</h3>
                  <p className="text-muted-foreground text-sm">
                    Simple and intuitive interface
                  </p>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Link
                  to="/login"
                  className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-background text-foreground border-2 border-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
