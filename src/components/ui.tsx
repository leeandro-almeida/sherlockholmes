import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// ---- Botao ----
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50';
  const variants = {
    primary:
      'bg-brass text-ink hover:bg-brass-soft active:translate-y-px shadow-sm shadow-black/40',
    ghost:
      'border border-line bg-transparent text-parchment hover:border-brass hover:text-brass-soft',
    danger:
      'border border-rust/50 bg-transparent text-rust hover:bg-rust hover:text-parchment',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

// ---- Campo de texto ----
type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-md border border-line bg-coal px-3.5 py-2.5 text-parchment outline-none transition placeholder:text-muted/60 focus:border-brass ${className}`}
        {...props}
      />
    </label>
  );
}

// ---- Cartao ----
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-coal/80 p-6 shadow-lg shadow-black/30 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

// ---- Brasao / cabecalho do app ----
export function Crest({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-brass/40 text-2xl text-brass">
        🔍
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-wide text-parchment">
        Sherlock
      </h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

// ---- Mensagem de erro ----
export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-rust">{children}</p>;
}
