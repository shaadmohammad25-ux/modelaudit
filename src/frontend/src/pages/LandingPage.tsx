import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [triggered, target, duration]);

  return { count, ref };
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function IconBias() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="20"
        width="4"
        height="5"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="9"
        y="14"
        width="4"
        height="11"
        fill="currentColor"
        opacity="0.7"
      />
      <rect x="15" y="9" width="4" height="16" fill="currentColor" />
      <rect
        x="21"
        y="16"
        width="4"
        height="9"
        fill="currentColor"
        opacity="0.6"
      />
      <line
        x1="3"
        y1="7"
        x2="25"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function IconSafety() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 3L4 7.5V14C4 19 8.5 23.5 14 25C19.5 23.5 24 19 24 14V7.5L14 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M9 14l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReport() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="18"
        height="22"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="9"
        y1="9"
        x2="19"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="9"
        y1="13"
        x2="19"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="9"
        y1="17"
        x2="15"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="20"
        cy="21"
        r="5"
        fill="var(--color-bg, #0D0F12)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="18"
        y1="21"
        x2="22"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="20"
        y1="19"
        x2="20"
        y2="23"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconRegulatory() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 14h20M14 4a16 16 0 010 20M14 4a16 16 0 000 20"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

// ─── Trust signal card ───────────────────────────────────────────────────────
function TrustCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border p-6 rounded-[0.25rem] bg-card relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "var(--color-accent)" }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="border border-border p-6 rounded-[0.25rem] bg-card transition-smooth hover:border-primary/60">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </article>
  );
}

// ─── Main landing page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const { count, ref: counterRef } = useCountUp(847, 2200);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ── */}
      <nav
        data-ocid="landing.nav"
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-smooth ${
          scrolled
            ? "border-border bg-card/95 backdrop-blur-sm"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 group"
            aria-label="ModelAudit home"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 2L3 6.5V12C3 17 7 21.5 12 23C17 21.5 21 17 21 12V6.5L12 2Z"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M8 12l2.5 2.5L16 9"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              ModelAudit
            </span>
          </a>
          <Link
            to="/login"
            data-ocid="landing.signin_link"
            className="font-body text-sm text-muted-foreground hover:text-foreground transition-smooth border border-border px-4 py-1.5 rounded-[0.25rem] hover:border-primary/50"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        data-ocid="landing.hero_section"
        className="pt-32 pb-24 px-6 bg-background"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-3xl">
            <p className="font-mono text-xs tracking-[0.25em] text-primary uppercase mb-6">
              AI Ethics &amp; Compliance Platform
            </p>
            <h1 className="font-display text-[clamp(3rem,6vw,5rem)] font-black leading-[1.05] text-foreground mb-6">
              Hold AI{" "}
              <span className="relative inline-block">
                Accountable.
                <span
                  className="absolute -bottom-1 left-0 right-0 h-[3px]"
                  style={{ background: "var(--color-accent)" }}
                  aria-hidden="true"
                />
              </span>
            </h1>
            <p className="font-body text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Audit AI models for bias, safety, and regulatory compliance. Get
              structured reports with risk scores, remediation guidance, and
              full audit trails.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                to="/audit/new"
                data-ocid="landing.hero_cta_button"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-body font-semibold text-base rounded-[0.25rem] transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-bg)",
                }}
              >
                Run Your First Audit Free
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <a
                href="#sample-report"
                data-ocid="landing.sample_report_link"
                className="font-body text-base transition-smooth hover:opacity-90 underline underline-offset-4"
                style={{ color: "var(--color-secondary)" }}
              >
                View Sample Report
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section
        data-ocid="landing.trust_section"
        className="py-16 px-6 border-y border-border"
        style={{ background: "oklch(0.09 0 0)" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-xs tracking-[0.25em] text-muted-foreground uppercase mb-8 text-center">
            Trusted Infrastructure
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrustCard>
              <div className="flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6 10l2.5 2.5L14 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="font-display font-semibold text-foreground text-base mb-1">
                    12 Countries
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Trusted by regulators and compliance officers worldwide
                  </p>
                </div>
              </div>
            </TrustCard>
            <TrustCard>
              <div className="flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <rect
                    x="4"
                    y="3"
                    width="12"
                    height="14"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7 8h6M7 11h4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <p className="font-display font-semibold text-foreground text-base mb-1">
                    SOC 2 Type II
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Certified compliant — audit logs, encryption, access
                    controls
                  </p>
                </div>
              </div>
            </TrustCard>
            <TrustCard>
              <div className="flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 6v4l3 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <p className="font-display font-semibold text-foreground text-base mb-1">
                    Open Methodology
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Fully documented audit framework — no black boxes
                  </p>
                </div>
              </div>
            </TrustCard>
          </div>
        </div>
      </section>

      {/* ── ANIMATED COUNTER ── */}
      <section
        data-ocid="landing.counter_section"
        className="py-20 px-6 bg-background"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center text-center">
          <div ref={counterRef}>
            <p
              className="font-mono font-bold leading-none mb-2"
              style={{
                fontSize: "clamp(4rem, 10vw, 7.5rem)",
                color: "var(--color-accent)",
              }}
              aria-live="polite"
              aria-label={`${count} audits run`}
            >
              {count.toLocaleString()}
            </p>
            <p className="font-display text-2xl font-semibold text-foreground mb-3">
              Audits Run
            </p>
          </div>
          <p className="font-body text-sm text-muted-foreground tracking-wide">
            Across{" "}
            <span
              className="font-mono"
              style={{ color: "var(--color-secondary)" }}
            >
              34
            </span>{" "}
            AI systems in{" "}
            <span
              className="font-mono"
              style={{ color: "var(--color-secondary)" }}
            >
              8
            </span>{" "}
            jurisdictions
          </p>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section
        data-ocid="landing.features_section"
        className="py-20 px-6 border-y border-border"
        style={{ background: "oklch(0.09 0 0)" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <p className="font-mono text-xs tracking-[0.25em] text-primary uppercase mb-3">
              Core Capabilities
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Every Layer of AI Risk, Covered
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={<IconBias />}
              title="Bias Detection"
              description="Probe 7 demographic dimensions with statistical disparity metrics and real examples from submitted outputs."
            />
            <FeatureCard
              icon={<IconSafety />}
              title="Safety Scoring"
              description="Flag harmful content, misinformation potential, PII exposure risk, and manipulative language patterns."
            />
            <FeatureCard
              icon={<IconReport />}
              title="Transparency Reports"
              description="Generate downloadable audit reports with full methodology, findings, remediation plans, and executive summaries."
            />
            <FeatureCard
              icon={<IconRegulatory />}
              title="Regulatory Mapping"
              description="Map findings to EU AI Act, NYC Local Law 144, US Executive Order 14110, and ISO/IEC 42001 compliance requirements."
            />
          </div>
        </div>
      </section>

      {/* ── SAMPLE REPORT PREVIEW ── */}
      <section
        id="sample-report"
        data-ocid="landing.sample_report_section"
        className="py-20 px-6 bg-background"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10">
            <p className="font-mono text-xs tracking-[0.25em] text-primary uppercase mb-3">
              See It In Action
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              What an Audit Looks Like
            </h2>
          </div>

          {/* Report mockup */}
          <div className="relative max-w-4xl">
            {/* Blurred image */}
            <div
              className="border border-border rounded-[0.25rem] overflow-hidden relative"
              style={{ filter: "blur(3px) brightness(0.55)" }}
              aria-hidden="true"
            >
              <img
                src="/assets/generated/audit-report-preview.dim_900x600.jpg"
                alt=""
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>

            {/* Overlay label */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <div className="relative" style={{ transform: "rotate(-8deg)" }}>
                <div
                  className="px-8 py-3 border-2 rounded-[0.25rem]"
                  style={{ borderColor: "var(--color-accent)" }}
                >
                  <p
                    className="font-mono font-bold text-lg tracking-[0.3em] uppercase"
                    style={{ color: "var(--color-accent)" }}
                  >
                    REDACTED — SAMPLE REPORT
                  </p>
                </div>
              </div>
            </div>

            {/* Risk badge visible through blur */}
            <div
              className="absolute top-6 right-6 pointer-events-none"
              aria-hidden="true"
            >
              <div
                className="px-4 py-2 rounded-[0.25rem] font-mono font-bold text-sm tracking-widest"
                style={{
                  background: "oklch(0.45 0.22 25 / 0.9)",
                  color: "oklch(0.96 0 0)",
                  border: "1px solid oklch(0.55 0.22 25)",
                }}
              >
                ◆ CRITICAL
              </div>
            </div>
          </div>

          <p className="font-body text-sm text-muted-foreground mt-4">
            Real audit reports include bias radar charts, flagged output
            examples, and a full regulatory compliance matrix.
          </p>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section
        data-ocid="landing.footer_cta_section"
        className="py-24 px-6 border-t border-border"
        style={{ background: "oklch(0.09 0 0)" }}
      >
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="font-display text-4xl font-black text-foreground mb-4">
            Ready to audit your AI system?
          </h2>
          <p className="font-body text-base text-muted-foreground mb-10 max-w-md mx-auto">
            Deploy with confidence. Hold your models to the standard your users
            deserve.
          </p>
          <Link
            to="/audit/new"
            data-ocid="landing.footer_cta_button"
            className="inline-flex items-center gap-2 px-8 py-4 font-body font-semibold text-base rounded-[0.25rem] transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-bg)",
            }}
          >
            Start Your First Audit →
          </Link>
          <p className="font-mono text-xs text-muted-foreground mt-5 tracking-wide">
            Free tier includes 5 audits/month. No credit card required.
          </p>
        </div>
      </section>

      {/* ── PAGE FOOTER ── */}
      <footer
        data-ocid="landing.page_footer"
        className="py-8 px-6 border-t border-border bg-background"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 2L3 6.5V12C3 17 7 21.5 12 23C17 21.5 21 17 21 12V6.5L12 2Z"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            <span className="font-mono text-xs text-muted-foreground">
              ModelAudit © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/methodology"
              data-ocid="landing.methodology_link"
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              Methodology
            </a>
            <a
              href="/privacy"
              data-ocid="landing.privacy_link"
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              Privacy
            </a>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              Built with caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
