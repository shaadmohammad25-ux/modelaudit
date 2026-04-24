import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

export default function LoginPage() {
  const { login, isAuthenticated, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4"
      data-ocid="login.page"
    >
      {/* Faint grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground, #F2EFE8) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground, #F2EFE8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="border border-border bg-card p-10 rounded shadow-lg">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-full border-2 border-primary bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                ModelAudit
              </h1>
              <p className="mt-1 text-sm font-mono text-muted-foreground tracking-wide">
                AI Ethics &amp; Bias Auditing
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-8" />

          {/* Tagline */}
          <p className="text-center text-sm text-muted-foreground leading-relaxed mb-8 font-body">
            Professional-grade transparency reports for AI systems. Identify
            bias, flag safety risks, and map regulatory compliance.
          </p>

          {/* Login button */}
          <Button
            className="w-full font-mono tracking-wide"
            onClick={login}
            disabled={isInitializing || isLoggingIn}
            data-ocid="login.submit_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing…
              </>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-muted-foreground font-mono">
            Decentralized auth via Internet Computer
          </p>
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            SOC 2 Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Open Methodology
          </span>
        </div>
      </div>
    </div>
  );
}
