import { useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';

/** AsciiBox - terminal panel with +-- TITLE ----+ borders. */
export function AsciiBox({ title, width = null, children, footer = null, className = '', testId, glow = false }) {
    const ref = useRef(null);
    // Compute simple ASCII top/bottom only on desktop (decorative). On mobile we
    // collapse to a thin border + title line for readability.
    return (
        <section
            ref={ref}
            data-testid={testId}
            className={`relative border border-[#2E4A2E] bg-[#070807] ${className}`}
            style={glow ? { boxShadow: '0 0 30px rgba(0,255,102,0.06) inset' } : undefined}
        >
            {title ? (
                <header className="flex items-center justify-between px-3 py-1.5 border-b border-[#2E4A2E]">
                    <h2 className="movs-accent text-xs sm:text-sm uppercase tracking-[0.06em]">
                        +-- {title} --
                    </h2>
                </header>
            ) : null}
            <div className="px-3 py-3 sm:px-4 sm:py-4">{children}</div>
            {footer ? (
                <footer className="px-3 py-1.5 border-t border-[#2E4A2E] movs-muted text-xs">{footer}</footer>
            ) : null}
        </section>
    );
}

export function AsciiButton({ children, onClick, variant = 'default', disabled, type = 'button', className = '', testId, ...rest }) {
    const cls =
        variant === 'solid' ? 'movs-btn movs-btn--solid' :
        variant === 'danger' ? 'movs-btn movs-btn--danger' :
        'movs-btn';
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            data-testid={testId}
            className={`${cls} ${className}`}
            {...rest}
        >
            <span aria-hidden="true">[</span>
            <span className="px-1">{children}</span>
            <span aria-hidden="true">]</span>
        </button>
    );
}

export function BracketLink({ to, onClick, children, testId, className = '' }) {
    const handle = (e) => {
        if (onClick) {
            e.preventDefault();
            onClick(e);
        }
    };
    return (
        <a href={to || '#'} onClick={handle} className={`movs-bracket ${className}`} data-testid={testId}>
            [[ {children} ]]
        </a>
    );
}

export function BlinkingCursor() {
    return <span className="movs-cursor" aria-hidden="true" />;
}

export function StatLine({ label, value, accent = false, mono = true, testId }) {
    return (
        <div className="flex items-baseline gap-2 py-0.5" data-testid={testId}>
            <span className="movs-muted uppercase tracking-[0.06em] text-[11px]">{label}</span>
            <span className="flex-1 border-b border-dashed border-[#1E2A1E]" />
            <span className={`${accent ? 'movs-accent' : ''} ${mono ? 'tabular-nums' : ''} text-sm`}>{value}</span>
        </div>
    );
}

/** AsciiProgress - [████░░░░░░░░] 33% */
export function AsciiProgress({ percent = 0, width = 28, label = '', testId }) {
    const p = Math.max(0, Math.min(1, percent));
    const filled = Math.round(p * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return (
        <div className="flex items-center gap-2 text-sm" data-testid={testId}>
            {label ? <span className="movs-muted text-xs uppercase tracking-[0.06em]">{label}</span> : null}
            <span className="movs-accent">[{bar}]</span>
            <span className="movs-dim tabular-nums text-xs">{(p * 100).toFixed(2)}%</span>
        </div>
    );
}

export function CopyButton({ value, label = null, testId }) {
    const { t } = useI18n();
    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (_) {}
    };
    return (
        <button onClick={onCopy} className="movs-bracket text-xs" data-testid={testId} title="copy">
            [ {label ?? t('copy')} ]
        </button>
    );
}

export function LanguageToggle() {
    const { lang, setLang } = useI18n();
    return (
        <div
            className="fixed bottom-3 left-3 z-50 movs-pre text-xs sm:text-sm bg-[#070807] border border-[#2E4A2E] px-2 py-1"
            data-testid="language-toggle"
        >
            <span className="movs-muted">[ </span>
            <button
                onClick={() => setLang('id')}
                className={lang === 'id' ? 'movs-accent font-bold' : 'movs-dim'}
                data-testid="lang-id"
            >
                ID
            </button>
            <span className="movs-muted"> | </span>
            <button
                onClick={() => setLang('en')}
                className={lang === 'en' ? 'movs-accent font-bold' : 'movs-dim'}
                data-testid="lang-en"
            >
                EN
            </button>
            <span className="movs-muted"> ]</span>
        </div>
    );
}

/** Typewriter - reveal text char-by-char for short strings. */
export function TypewriterText({ text, speed = 22, className = '' }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        el.textContent = '';
        let i = 0;
        const id = setInterval(() => {
            el.textContent = text.slice(0, i + 1);
            i++;
            if (i >= text.length) clearInterval(id);
        }, speed);
        return () => clearInterval(id);
    }, [text, speed]);
    return <span ref={ref} className={className} aria-label={text} />;
}
