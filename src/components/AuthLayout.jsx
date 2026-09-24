import React from "react";
import Logo from "@/components/Logo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo variant="watermark" size={520} />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4 animate-steel-fade-up">
            <Logo variant="mark" size={56} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground animate-steel-fade-up" style={{ animationDelay: "0.05s" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2 animate-steel-fade-up" style={{ animationDelay: "0.1s" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 animate-steel-fade-up" style={{ animationDelay: "0.15s" }}>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6 animate-steel-fade-up" style={{ animationDelay: "0.2s" }}>
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}