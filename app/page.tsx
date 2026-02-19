"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Email {
  sender: string;
  subject: string;
  body: string;
  html: string;
  date: string;
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

  // Create inbox on mount
  useEffect(() => {
    createInbox();
  }, [createInbox]);

  // Poll for emails every 5s
  useEffect(() => {
    if (!token) return;
    fetchEmails();
    intervalRef.current = setInterval(fetchEmails, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, fetchEmails]);

  // Counter for "seconds since creation"
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
    if (seconds < 60) return `${seconds} seconds`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minute${mins > 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen">
      {/* ===== NAVBAR ===== */}
      <nav className="bg-navbar">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-navbar-text hover:text-white transition-colors">
              Blog
            </a>
            <a href="#" className="text-sm text-navbar-text hover:text-white transition-colors">
              API
            </a>
          </div>

          <a href="#" className="flex items-center gap-2 text-white font-semibold text-lg">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
            TempMail
          </a>

          <button className="rounded bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
            LOGIN
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="bg-navbar pb-12 pt-10">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Your Temporary Email Address
          </h1>
          <p className="mt-2 text-sm text-navbar-text">
            Forget about spam, advertising mailings, hacking and attacking robots.
          </p>

          {/* Email pill */}
          <div className="mt-8 flex items-center justify-center">
            <div className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-lg font-medium text-white shadow-lg">
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13L2 4" />
              </svg>
              {loading ? "Generating..." : address || "Loading..."}
            </div>
          </div>

          {/* Counter */}
          <p className="mt-3 text-sm text-navbar-text">
            Temporary email created {formatTimeAgo(counter)} ago
          </p>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
              </svg>
              Reset
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </section>

      {/* ===== INBOX ===== */}
      <section className="bg-background py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl bg-surface shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              <span>Sender</span>
              <span>Subject</span>
              <span>Date</span>
            </div>

            {/* Email List or Empty State */}
            {emails.length > 0 ? (
              <div>
                {emails.map((email, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedEmail(email)}
                    className="grid w-full grid-cols-[1fr_2fr_auto] gap-4 border-b border-border/50 px-6 py-4 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="truncate font-medium text-foreground">
                      {email.sender}
                    </span>
                    <span className="truncate text-muted">{email.subject}</span>
                    <span className="whitespace-nowrap text-xs text-muted">
                      {formatDate(email.date)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted">
                <svg
                  className="h-8 w-8 animate-spin text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                <p className="mt-4 text-sm font-medium">Waiting for emails...</p>
                <p className="mt-1 text-xs text-muted">
                  Send an email to <span className="font-medium text-primary">{address}</span> and it will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== SELECTED EMAIL MODAL ===== */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedEmail.subject}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  From: {selectedEmail.sender}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(selectedEmail.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="rounded-lg p-2 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              {selectedEmail.html ? (
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-foreground">
                  {selectedEmail.body}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      <section className="bg-background pb-16 pt-4">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl bg-surface p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              What is TempMail?
            </h2>
            <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted">
              <div>
                <h3 className="font-semibold text-foreground">
                  Disposable Temporary Email
                </h3>
                <p className="mt-2">
                  TempMail provides you with a temporary, anonymous email address
                  that automatically expires. Use it to protect your real email
                  from spam, unwanted newsletters, and data breaches. No
                  registration required — just visit the site and your temporary
                  inbox is ready.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
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
                <h3 className="font-semibold text-foreground">
                  How Does It Work?
                </h3>
                <p className="mt-2">
                  When you visit TempMail, we automatically generate a unique
                  email address for you. Any emails sent to this address will
                  appear in your inbox above in real-time. You can copy the
                  address, use it wherever you need, and receive incoming mail
                  instantly. When you&apos;re done, simply reset to get a fresh
                  address — or just close the page and let it expire.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Key Features
                </h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>No registration or personal information required</li>
                  <li>Instant email address generation</li>
                  <li>Real-time inbox with automatic refresh</li>
                  <li>Copy address to clipboard with one click</li>
                  <li>Generate a new address at any time</li>
                  <li>Completely free to use</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
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
      <footer className="border-t border-border bg-navbar py-8">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-xs text-navbar-text">
            TempMail &mdash; Free Temporary Email Service
          </p>
          <p className="mt-2 text-xs text-navbar-text/50">
            &copy; 2026 TempMail
          </p>
        </div>
      </footer>
    </div>
  );
}
