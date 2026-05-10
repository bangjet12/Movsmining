import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { fmtMOVS } from '@/lib/format';
import { AsciiBox, StatLine, AsciiProgress, BracketLink, TypewriterText } from '@/components/ascii';

const LOGO = `
┌─┐ ┌─┐ ┌─┐ ─┐ ┌─
│ │ │ │ │ │ │ │
└─┘ └─┘ └ ┘ ─┘
`;

export default function Landing() {
    const { t, lang } = useI18n();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const load = () => apiClient.get('/network/stats').then((r) => setStats(r.data)).catch(() => {});
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    const minted = stats?.minted_supply || 0;
    const total = stats?.total_supply || 1_000_000;
    const pct = minted / total;

    return (
        <div className="mx-auto max-w-5xl px-3 sm:px-6 py-6 space-y-6" data-testid="page-landing">
            {/* Hero */}
            <section className="py-4">
                <pre className="movs-pre text-[13px] sm:text-base movs-accent-strong">
{`+-------------------------------------------------+
|  M O V S  ::  proof-of-work mining network      |
+-------------------------------------------------+`}
                </pre>
                <h1 className="mt-3 text-2xl sm:text-4xl font-bold movs-accent tracking-[0.06em] uppercase">
                    <TypewriterText text="// movs :: mining agent" speed={28} />
                </h1>
                <p className="mt-2 movs-dim text-sm sm:text-base max-w-3xl">{t('landing_subtitle')}</p>
                <p className="mt-1 movs-muted text-xs sm:text-sm">{t('tribute')}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link to="/login" data-testid="hero-cta-login">
                        <span className="movs-bracket text-base">[[ {t('signin')} ]]</span>
                    </Link>
                    <Link to="/explorer" data-testid="hero-cta-explorer">
                        <span className="movs-bracket text-base">[[ {t('nav_explorer')} ]]</span>
                    </Link>
                </div>
            </section>

            {/* Network stats */}
            <AsciiBox title="NETWORK STATS" testId="box-network-stats" glow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <StatLine label={t('net_total_supply')} value={`${fmtMOVS(total)} MOVS`} testId="stat-supply" />
                    <StatLine label={t('net_minted')} value={`${fmtMOVS(minted)} MOVS`} testId="stat-minted" accent />
                    <StatLine label={t('net_remaining')} value={`${fmtMOVS(total - minted)} MOVS`} testId="stat-remaining" />
                    <StatLine label={t('net_height')} value={fmtMOVS(stats?.block_height || 0)} testId="stat-height" />
                    <StatLine label={t('net_reward')} value={`${fmtMOVS(stats?.current_reward || 0)} MOVS / blk`} testId="stat-reward" />
                    <StatLine label={t('net_difficulty')} value={`${stats?.difficulty_bits || 0} bits`} testId="stat-difficulty" />
                    <StatLine label={t('net_next_halving')} value={`#${fmtMOVS(stats?.next_halving_at || 0)}`} testId="stat-halving" />
                    <StatLine label={t('net_miners')} value={fmtMOVS(stats?.total_miners || 0)} testId="stat-miners" />
                </div>
                <div className="mt-4">
                    <AsciiProgress percent={pct} width={32} label={`${t('net_minted')} %`} testId="progress-supply" />
                </div>
            </AsciiBox>

            {/* About */}
            <AsciiBox title="ABOUT" testId="box-about">
                <p className="text-sm leading-relaxed">{t('landing_intro')}</p>
                <ul className="mt-3 text-sm space-y-1 movs-dim">
                    <li>&gt; sha-256 proof-of-work in the browser (web worker, non-blocking)</li>
                    <li>&gt; halving every 10,000 blocks :: initial reward 50 MOVS</li>
                    <li>&gt; supply cap: 1,000,000 MOVS (immutable)</li>
                    <li>&gt; magic-link login (no passwords)</li>
                    <li>&gt; send / receive between users :: full chain explorer</li>
                </ul>
            </AsciiBox>

            {/* CTA */}
            <AsciiBox title="GET STARTED" testId="box-cta">
                <p className="text-sm movs-dim">
                    {lang === 'id'
                        ? '> masukkan email anda untuk mendapatkan tautan login. dompet dibuat otomatis.'
                        : '> enter your email to receive a login link. wallet auto-created.'}
                </p>
                <div className="mt-3">
                    <BracketLink to="/login" testId="cta-go-login">{t('signin')}</BracketLink>
                </div>
            </AsciiBox>
        </div>
    );
}
