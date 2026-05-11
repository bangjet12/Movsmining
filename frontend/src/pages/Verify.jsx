import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { AsciiBox, BlinkingCursor, AsciiButton } from '@/components/ascii';

export default function Verify() {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [status, setStatus] = useState('verifying'); // verifying|success|error
    const [err, setErr] = useState(null);
    const { loginWithToken } = useAuth();
    const { t } = useI18n();
    const nav = useNavigate();

    useEffect(() => {
    if (!token) {
        setStatus('error');
        setErr('missing token');
        return;
    }

    (async () => {
        try {
            const r = await apiClient.get(`/auth/verify?token=${encodeURIComponent(token)}`);
            await loginWithToken(r.data.token, r.data.user);
            setStatus('success');
            setTimeout(() => nav('/dashboard'), 600);
        } catch (e) {
            setStatus('error');
            setErr(e?.response?.data?.detail || 'verification failed');
        }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);

    return (
        <div className="mx-auto max-w-2xl px-3 sm:px-6 py-12" data-testid="page-verify">
            <AsciiBox title="VERIFY" testId="box-verify">
                {status === 'verifying' && (
                    <p className="movs-dim" data-testid="verify-status">
                        <span>[...] {t('verify_in_progress')}</span>
                        <BlinkingCursor />
                    </p>
                )}
                {status === 'success' && (
                    <p className="movs-accent" data-testid="verify-success">[ok] {t('verify_success')}</p>
                )}
                {status === 'error' && (
                    <div className="space-y-3" data-testid="verify-error">
                        <p className="movs-danger">! {t('verify_failed')} :: {err}</p>
                        <AsciiButton onClick={() => nav('/login')} testId="verify-retry">
                            {t('verify_retry')}
                        </AsciiButton>
                    </div>
                )}
            </AsciiBox>
        </div>
    );
}
