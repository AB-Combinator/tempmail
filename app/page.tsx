"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Email {
  sender: string;
  subject: string;
  body: string;
  html: string;
  date: string;
}

function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
      aria-label="Toggle theme"
    >
      {isLight ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [token, setToken] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [counter, setCounter] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createInbox = useCallback(async () => {
    setLoading(true);
    setEmails([]);
    setSelectedEmail(null);
    setCounter(0);
    try {
      const res = await fetch("/api/inbox", { method: "POST" });
      const data = await res.json();
      if (data.address && data.token) {
        setAddress(data.address);
        setToken(data.token);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/inbox?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.emails && Array.isArray(data.emails)) {
        setEmails(data.emails);
      }
    } catch {
      // silently fail
    }
  }, [token]);

  useEffect(() => {
    createInbox();
  }, [createInbox]);

  useEffect(() => {
    if (!token) return;
    fetchEmails();
    intervalRef.current = setInterval(fetchEmails, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, fetchEmails]);

  useEffect(() => {
    if (!address) return;
    counterRef.current = setInterval(() => {
      setCounter((c) => c + 1);
    }, 1000);
    return () => {
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, [address]);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (counterRef.current) clearInterval(counterRef.current);
    createInbox();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ===== NAVBAR ===== */}
      <nav
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg) 80%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13L2 4" />
              </svg>
            </div>
            <span className="text-base font-semibold" style={{ color: "var(--text)" }}>
              TempMail
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pb-16 pt-20">
        {/* Background gradient orb */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)" }}
        />

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <div className="animate-fade-in">
            <p
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              Free &middot; No signup required
            </p>
          </div>

          <h1
            className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl animate-fade-in"
            style={{ color: "var(--text)", animationDelay: "0.05s" }}
          >
            Your Temporary{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Email Address
            </span>
          </h1>

          <p
            className="mx-auto mt-4 max-w-md text-base animate-fade-in"
            style={{ color: "var(--text-secondary)", animationDelay: "0.1s" }}
          >
            Protect your privacy. No spam, no tracking, no hassle.
          </p>

          {/* Email address card */}
          <div
            className="mt-10 rounded-2xl p-[1px] animate-fade-in"
            style={{
              background: "linear-gradient(135deg, var(--border-strong), var(--border))",
              animationDelay: "0.15s",
            }}
          >
            <div className="rounded-2xl px-6 py-5" style={{ background: "var(--surface)" }}>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13L2 4" />
                  </svg>
                </div>
                <span
                  className="text-lg font-mono font-medium tracking-tight sm:text-xl"
                  style={{ color: "var(--text)" }}
                >
                  {loading ? (
                    <span style={{ color: "var(--text-muted)" }}>Generating...</span>
                  ) : (
                    address || "Loading..."
                  )}
                </span>
              </div>

              <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                Active for {formatTimeAgo(counter)}
              </p>

              {/* Action buttons */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: copied
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white",
                  }}
                >
                  {copied ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "var(--surface-hover)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                  </svg>
                  New Address
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INBOX ===== */}
      <section className="pb-8 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Inbox
            </h2>
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              Auto-refreshing
            </span>
          </div>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Table Header */}
            <div
              className="grid grid-cols-[1fr_2fr_auto] gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider"
              style={{
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>Sender</span>
              <span>Subject</span>
              <span>Date</span>
            </div>

            {emails.length > 0 ? (
              <div>
                {emails.map((email, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedEmail(email)}
                    className="grid w-full grid-cols-[1fr_2fr_auto] gap-4 px-5 py-4 text-left text-sm transition-colors duration-150 animate-fade-in"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      animationDelay: `${i * 0.05}s`,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span className="truncate font-medium" style={{ color: "var(--text)" }}>
                      {email.sender}
                    </span>
                    <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                      {email.subject}
                    </span>
                    <span className="whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(email.date)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse-glow"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  />
                  <div
                    className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                      background: "var(--surface-hover)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    <svg
                      className="h-7 w-7 animate-spin"
                      style={{ color: "var(--color-primary)" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  </div>
                </div>
                <p className="mt-5 text-sm font-medium" style={{ color: "var(--text)" }}>
                  Waiting for emails...
                </p>
                <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Send an email to{" "}
                  <span className="font-medium text-indigo-400">{address}</span>
                  {" "}and it will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== EMAIL MODAL ===== */}
      {selectedEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedEmail(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl animate-fade-in"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {selectedEmail.subject}
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  From: {selectedEmail.sender}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDate(selectedEmail.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="rounded-lg p-2 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {selectedEmail.html ? (
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: "var(--text)" }}
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              ) : (
                <pre
                  className="whitespace-pre-wrap text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {selectedEmail.body}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      <section className="px-6 pb-16 pt-8">
        <div className="mx-auto max-w-2xl">
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              What is TempMail?
            </h2>
            <div className="mt-6 space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  Disposable Temporary Email
                </h3>
                <p className="mt-2">
                  TempMail provides you with a temporary, anonymous email address
                  that automatically expires. Use it to protect your real email
                  from spam, unwanted newsletters, and data breaches. No
                  registration required.
                </p>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  Why Use a Temporary Email?
                </h3>
                <p className="mt-2">
                  Every time you sign up for a new service, subscribe to a
                  newsletter, or register on a forum, you risk exposing your
                  primary email to spam, phishing, and data harvesting. A
                  temporary email acts as a disposable shield — keeping your real
                  inbox clean and your identity private.
                </p>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  How Does It Work?
                </h3>
                <p className="mt-2">
                  When you visit TempMail, we automatically generate a unique
                  email address for you. Any emails sent to this address will
                  appear in your inbox in real-time. Copy the address, use it
                  wherever you need, and receive mail instantly. Reset for a fresh
                  address anytime.
                </p>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  Key Features
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {[
                    "No registration or personal information required",
                    "Instant email address generation",
                    "Real-time inbox with automatic refresh",
                    "Copy address to clipboard with one click",
                    "Generate a new address at any time",
                    "Completely free to use",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  Perfect For
                </h3>
                <p className="mt-2">
                  Testing sign-up flows, verifying accounts, downloading free
                  resources, accessing Wi-Fi portals, signing up for trials,
                  posting on forums, or any situation where you need an email but
                  don&apos;t want to use your real one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="px-6 pb-8">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="h-[1px] mb-8"
            style={{ background: "var(--border)" }}
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            TempMail &mdash; Free Temporary Email Service
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Powered by the{" "}
            <a
              href="https://tempmail.lol"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-indigo-400"
            >
              TempMail.lol
            </a>{" "}
            API. This site is an independent project and is not affiliated with or endorsed by TempMail.lol.
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            &copy; 2026 TempMail
          </p>
        </div>
      </footer>
    </div>
  );
}
