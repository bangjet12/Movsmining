import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { AsciiBox, AsciiButton, BlinkingCursor } from '@/components/ascii';

export default function Login() {
    const { t, lang } = useI18n();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle|sending|sent|error
    const [info, setInfo] = useState(null);
    const [err, setErr] = useState(null);
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setErr(null);
        const ok = /\S+@\S+\.\S+/.test(email);
        if (!ok) {
            setErr(t('login_invalid'));
            return;
        }
        setStatus('sending');
        try {
            const r = await apiClient.post(`/auth/request-link?lang=${lang}`, { email });
            setInfo(r.data);
            setStatus('sent');
        } catch (e) {
            setStatus('error');
            setErr(e?.response?.data?.detail || t('login_resend_failed'));
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-3 sm:px-6 py-8" data-testid="page-login">
            <AsciiBox title="LOGIN" testId="box-login">
                <pre className="movs-pre text-xs sm:text-sm mb-4 movs-dim">
{`> request a magic link
> we will email you a one-time login link
> link expires in 15 minutes`}
                </pre>

                {status !== 'sent' ? (
                    <form onSubmit={submit} className="space-y-3" data-testid="login-form">
                        <label className="block">
                            <span className="movs-accent text-xs uppercase tracking-[0.06em]">
                                {t('login_email_label')}
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('login_email_placeholder')}
                                disabled={status === 'sending'}
                                className="mt-1"
                                data-testid="login-email-input"
                                autoFocus
                                required
                            />
                        </label>
                        {err ? <p className="movs-danger text-sm" data-testid="login-error">{err}</p> : null}
                        <div className="flex items-center gap-3">
                            <AsciiButton
                                type="submit"
                                variant="solid"
                                disabled={status === 'sending' || !email}
                                testId="login-submit"
                            >
                                {status === 'sending' ? '...' : t('login_request')}
                            </AsciiButton>
                            <Link to="/" className="movs-bracket text-xs" data-testid="login-back">
                                [ {t('login_back')} ]
                            </Link>
                        </div>
                        {status === 'sending' ? (
                            <p className="movs-dim text-sm">
                                <span>[...] sending magic link</span>
                                <BlinkingCursor />
                            </p>
                        ) : null}
                    </form>
                ) : (
                    <div className="space-y-3" data-testid="login-success">
                        <p className="movs-accent">{t('login_check_inbox')}</p>
                        <p className="movs-muted text-xs">
                            {lang === 'id' ? 'periksa folder spam jika tidak terlihat.' : 'check spam folder if not visible.'}
                        </p>
                        {info?.dev_magic_link ? (
                            <div className="border border-[#FFB000] p-3 mt-2">
                                <p className="movs-warn text-xs uppercase tracking-[0.06em]">[ {t('login_dev_link')} ]</p>
                                <a
                                    href={info.dev_magic_link}
                                    className="movs-accent text-xs break-all underline"
                                    data-testid="login-dev-link"
                                >
                                    {info.dev_magic_link}
                                </a>
                            </div>
                        ) : null}
                        {!info?.email_sent && info?.email_error ? (
                            <p className="movs-warn text-xs">[warn] {info.email_error}</p>
                        ) : null}
                        <button
                            onClick={() => { setStatus('idle'); setInfo(null); setEmail(''); }}
                            className="movs-bracket text-xs"
                            data-testid="login-reset"
                        >
                            [ {lang === 'id' ? 'kirim ulang' : 'resend'} ]
                        </button>
                    </div>
                )}
            </AsciiBox>
        </div>
    );
}
