import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { shortAddr } from '@/lib/format';

export function Header() {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const nav = useNavigate();
    const loc = useLocation();

    const linkCls = (p) =>
        `movs-bracket text-xs sm:text-sm ${loc.pathname === p ? 'movs-accent-strong underline' : ''}`;

    const onLogout = () => {
        logout();
        nav('/');
    };

    return (
        <header className="border-b border-[#2E4A2E] bg-[#070807]" data-testid="app-header">
            <div className="mx-auto max-w-5xl px-3 sm:px-6 py-3 flex flex-wrap items-center gap-2 sm:gap-4">
                <Link to="/" className="movs-accent-strong font-bold tracking-[0.1em]" data-testid="brand-link">
                    MOVS
                </Link>
                <span className="movs-muted text-xs hidden sm:inline">::</span>
                <span className="movs-dim text-[11px] hidden sm:inline tracking-[0.06em] uppercase">
                    reusable proof-of-work
                </span>
                <nav className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Link to="/" className={linkCls('/')} data-testid="nav-home">[ {t('nav_home')} ]</Link>
                    {user ? (
                        <Link to="/dashboard" className={linkCls('/dashboard')} data-testid="nav-dashboard">
                            [ {t('nav_dashboard')} ]
                        </Link>
                    ) : null}
                    <Link to="/leaderboard" className={linkCls('/leaderboard')} data-testid="nav-leaderboard">
                        [ {t('nav_leaderboard')} ]
                    </Link>
                    <Link to="/explorer" className={linkCls('/explorer')} data-testid="nav-explorer">
                        [ {t('nav_explorer')} ]
                    </Link>
                    {user ? (
                        <>
                            <span className="movs-muted text-[11px] tracking-[0.06em] hidden md:inline">
                                {shortAddr(user.address)}
                            </span>
                            <button onClick={onLogout} className="movs-bracket text-xs sm:text-sm" data-testid="nav-logout">
                                [ {t('logout')} ]
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="movs-bracket text-xs sm:text-sm" data-testid="nav-login">
                            [ {t('signin')} ]
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
