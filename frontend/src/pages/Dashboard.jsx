import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { AsciiBox, AsciiButton, AsciiProgress, CopyButton, StatLine } from '@/components/ascii';
import { fmtMOVS, shortHash, shortAddr, fmtTime, fmtHashrate } from '@/lib/format';

function MineTab() {
    const { t, lang } = useI18n();
    const { user, refresh } = useAuth();
    const [stats, setStats] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const [running, setRunning] = useState(false);
    const [hashrate, setHashrate] = useState(0);
    const [foundCount, setFoundCount] = useState(0);
    const [logs, setLogs] = useState([]);
    const [flash, setFlash] = useState(false);
    const workerRef = useRef(null);
    const challengeRef = useRef(null);
    const runningRef = useRef(false);

    const log = useCallback((msg, kind = 'log') => {
        const ts = new Date().toLocaleTimeString();
        setLogs((arr) => [{ id: Date.now() + Math.random(), ts, msg, kind }, ...arr].slice(0, 80));
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const r = await apiClient.get('/network/stats');
            setStats(r.data);
        } catch (_) {}
    }, []);

    const loadChallenge = useCallback(async () => {
        try {
            const r = await apiClient.get('/mine/challenge');
            setChallenge(r.data);
            challengeRef.current = r.data;
            return r.data;
        } catch (e) {
            log('failed to load challenge', 'err');
            return null;
        }
    }, [log]);

    useEffect(() => {
        loadChallenge();
        loadStats();
        const id = setInterval(loadStats, 8000);
        return () => clearInterval(id);
    }, [loadChallenge, loadStats]);

    const ensureWorker = useCallback(() => {
        if (workerRef.current) return workerRef.current;
        const w = new Worker('/miner.worker.js');
        w.onmessage = async (ev) => {
            const msg = ev.data;
            if (msg.type === 'progress') {
                setHashrate(msg.hps);
            } else if (msg.type === 'found') {
                setFlash(true);
                setTimeout(() => setFlash(false), 800);
                log(`${t('mining_found')} nonce=${msg.nonce} hash=${shortHash(msg.hash, 10, 6)}`, 'ok');
                try {
                    const submitRes = await apiClient.post('/mine/submit', {
                        prev_hash: msg.prevHash,
                        height: msg.height,
                        nonce: msg.nonce,
                        hash: msg.hash,
                    });
                    if (submitRes.data.accepted) {
                        setFoundCount((c) => c + 1);
                        log(`[ok] block accepted h=${submitRes.data.block.height} reward=${submitRes.data.block.reward}`, 'ok');
                        await refresh();
                        await loadStats();
                    } else {
                        log(`[warn] block rejected: ${submitRes.data.reason}`, 'warn');
                    }
                } catch (e) {
                    log(`[err] submit failed: ${e?.message || 'unknown'}`, 'err');
                }
                // Continue with new challenge if still running
                if (runningRef.current) {
                    const c = await loadChallenge();
                    if (c && workerRef.current) {
                        workerRef.current.postMessage({
                            cmd: 'start',
                            job: {
                                prevHash: c.prev_hash,
                                address: c.address,
                                height: c.next_height,
                                difficultyBits: c.difficulty_bits,
                                startNonce: Math.floor(Math.random() * 1e9),
                            },
                        });
                    }
                }
            }
        };
        workerRef.current = w;
        return w;
    }, [loadChallenge, loadStats, log, refresh, t]);

    const start = async () => {
        const c = challenge || (await loadChallenge());
        if (!c) return;
        const w = ensureWorker();
        runningRef.current = true;
        setRunning(true);
        log(`[ok] mining started @ height=${c.next_height} difficulty=${c.difficulty_bits}`, 'ok');
        w.postMessage({
            cmd: 'start',
            job: {
                prevHash: c.prev_hash,
                address: c.address,
                height: c.next_height,
                difficultyBits: c.difficulty_bits,
                startNonce: Math.floor(Math.random() * 1e9),
            },
        });
    };

    const stop = () => {
        runningRef.current = false;
        setRunning(false);
        setHashrate(0);
        if (workerRef.current) workerRef.current.postMessage({ cmd: 'stop' });
        log('[stopped] mining halted', 'warn');
    };

    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.postMessage({ cmd: 'stop' });
                workerRef.current.terminate();
            }
        };
    }, []);

    const minted = stats?.minted_supply || 0;
    const total = stats?.total_supply || 1_000_000;

    return (
        <div className="space-y-4">
            <AsciiBox title="MINING CONTROL" testId="box-mining-control" className={flash ? 'movs-found-flash' : ''}>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    {!running ? (
                        <AsciiButton onClick={start} variant="solid" testId="mining-start-button">
                            {t('mining_start')}
                        </AsciiButton>
                    ) : (
                        <AsciiButton onClick={stop} variant="danger" testId="mining-stop-button">
                            {t('mining_stop')}
                        </AsciiButton>
                    )}
                    <span className="movs-pill" data-testid="mining-status">
                        {running ? t('mining_status_active') : t('mining_status_idle')}
                    </span>
                    <span className="movs-dim text-xs ml-auto" data-testid="mining-blocks-found">
                        {t('mining_blocks_found')}: <span className="movs-accent tabular-nums">{foundCount}</span>
                    </span>
                </div>

                <div className="space-y-1">
                    <StatLine label={t('mining_hashrate')} value={fmtHashrate(hashrate)} accent testId="mining-hashrate-readout" />
                    <StatLine label={t('net_height')} value={`#${challenge?.next_height ?? '-'}`} testId="mining-next-height" />
                    <StatLine label={t('net_reward')} value={`${fmtMOVS(challenge?.reward ?? 0)} MOVS`} accent testId="mining-reward" />
                    <StatLine label={t('net_difficulty')} value={`${challenge?.difficulty_bits ?? 0} bits`} testId="mining-difficulty" />
                    <div className="py-1">
                        <span className="movs-muted uppercase tracking-[0.06em] text-[11px]">{t('mining_challenge')}: </span>
                        <code className="movs-accent text-xs break-all" data-testid="mining-challenge">
                            {shortHash(challenge?.prev_hash || '', 16, 8)}
                        </code>
                        {challenge?.prev_hash ? <CopyButton value={challenge.prev_hash} testId="mining-challenge-copy" /> : null}
                    </div>
                </div>
            </AsciiBox>

            <AsciiBox title="NETWORK" testId="box-mining-network">
                <AsciiProgress percent={total ? minted / total : 0} width={32} label={`${t('net_minted')} %`} testId="mining-supply-progress" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-2">
                    <StatLine label={t('net_minted')} value={`${fmtMOVS(minted)} / ${fmtMOVS(total)}`} accent testId="net-minted" />
                    <StatLine label={t('net_blocks')} value={fmtMOVS(stats?.total_blocks || 0)} testId="net-blocks" />
                    <StatLine label={t('net_miners')} value={fmtMOVS(stats?.total_miners || 0)} testId="net-miners" />
                    <StatLine label={t('net_next_halving')} value={`#${fmtMOVS(stats?.next_halving_at || 0)}`} testId="net-halving" />
                </div>
            </AsciiBox>

            <AsciiBox title="LOG" testId="box-mining-log">
                <div className="max-h-72 overflow-auto text-xs space-y-0.5 movs-log" data-testid="mining-log-stream">
                    {logs.length === 0 ? (
                        <p className="movs-muted">[idle]</p>
                    ) : (
                        logs.map((l) => (
                            <div key={l.id} className={l.kind}>
                                <span className="movs-muted">[{l.ts}]</span> {l.msg}
                            </div>
                        ))
                    )}
                </div>
            </AsciiBox>
        </div>
    );
}

function WalletTab() {
    const { t } = useI18n();
    const { user, refresh } = useAuth();
    const [w, setW] = useState(user);
    useEffect(() => {
        apiClient.get('/wallet').then((r) => setW(r.data)).catch(() => {});
    }, []);
    const data = w || user;
    return (
        <AsciiBox title="WALLET" testId="box-wallet">
            <div className="space-y-1">
                <div className="py-1">
                    <span className="movs-muted uppercase tracking-[0.06em] text-[11px]">{t('wallet_address')}: </span>
                    <code className="movs-accent text-sm break-all" data-testid="wallet-address">{data?.address}</code>
                    {data?.address ? <CopyButton value={data.address} testId="wallet-address-copy" /> : null}
                </div>
                <StatLine label={t('wallet_balance')} value={`${fmtMOVS(data?.balance ?? 0, 8)} MOVS`} accent testId="wallet-balance" />
                <StatLine label={t('wallet_total_mined')} value={`${fmtMOVS(data?.total_mined ?? 0, 8)} MOVS`} testId="wallet-total-mined" />
                <StatLine label={t('wallet_blocks_mined')} value={fmtMOVS(data?.blocks_mined ?? 0)} testId="wallet-blocks-mined" />
            </div>
        </AsciiBox>
    );
}

function SendTab() {
    const { t } = useI18n();
    const { refresh } = useAuth();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        setBusy(true);
        try {
            const r = await apiClient.post('/wallet/send', {
                recipient: recipient.trim(),
                amount: parseFloat(amount),
                note: note || null,
            });
            setMsg(`${t('send_success')} :: tx=${shortHash(r.data.tx_id, 10, 6)}`);
            setRecipient(''); setAmount(''); setNote('');
            await refresh();
        } catch (e) {
            setErr(e?.response?.data?.detail || t('send_error'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AsciiBox title="SEND MOVS" testId="box-send">
            <form onSubmit={submit} className="space-y-3 max-w-xl" data-testid="send-form">
                <label className="block">
                    <span className="movs-accent text-xs uppercase tracking-[0.06em]">{`> ${t('send_recipient')}`}</span>
                    <input
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="mt-1"
                        placeholder="movs1... or user@mail"
                        data-testid="send-to-input"
                        required
                    />
                </label>
                <label className="block">
                    <span className="movs-accent text-xs uppercase tracking-[0.06em]">{`> ${t('send_amount')}`}</span>
                    <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1"
                        placeholder="0.0"
                        data-testid="send-amount-input"
                        required
                    />
                </label>
                <label className="block">
                    <span className="movs-muted text-xs uppercase tracking-[0.06em]">{`> ${t('send_note')}`}</span>
                    <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" data-testid="send-note-input" />
                </label>
                {err ? <p className="movs-danger text-sm" data-testid="send-error">! {err}</p> : null}
                {msg ? <p className="movs-accent text-sm" data-testid="send-success">{msg}</p> : null}
                <AsciiButton type="submit" variant="solid" disabled={busy} testId="send-submit-button">
                    {busy ? '...' : t('send_submit')}
                </AsciiButton>
            </form>
        </AsciiBox>
    );
}

function HistoryTab() {
    const { t } = useI18n();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = () => apiClient.get('/wallet/transactions').then((r) => setItems(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
        load();
        const id = setInterval(load, 8000);
        return () => clearInterval(id);
    }, []);
    return (
        <AsciiBox title="TRANSACTION HISTORY" testId="box-history">
            {loading ? (
                <p className="movs-dim">{t('loading')}...</p>
            ) : items.length === 0 ? (
                <p className="movs-muted">{t('history_empty')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="movs-table" data-testid="tx-history-table">
                        <thead>
                            <tr>
                                <th>{t('history_type')}</th>
                                <th>{t('history_amount')}</th>
                                <th>{t('history_counter')}</th>
                                <th className="hidden sm:table-cell">block</th>
                                <th>{t('history_time')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => {
                                const positive = it.direction === 'in';
                                const counter = it.type === 'mining_reward'
                                    ? '<network>'
                                    : positive ? (it.from_email || shortAddr(it.from_address))
                                               : (it.to_email || shortAddr(it.to_address));
                                const typeLabel = it.type === 'mining_reward' ? 'mining' : it.type;
                                return (
                                    <tr key={it.id || idx} data-testid={`tx-row-${idx}`}>
                                        <td>
                                            <span className={positive ? 'movs-accent' : 'movs-warn'}>
                                                {positive ? '+' : '-'} {typeLabel}
                                            </span>
                                        </td>
                                        <td className="tabular-nums">
                                            <span className={positive ? 'movs-accent' : ''}>
                                                {fmtMOVS(it.amount, 8)}
                                            </span>
                                        </td>
                                        <td className="truncate-mono max-w-[12ch] sm:max-w-none">{counter}</td>
                                        <td className="hidden sm:table-cell movs-muted">{it.block_height ? `#${it.block_height}` : '-'}</td>
                                        <td className="movs-muted text-xs">{fmtTime(it.timestamp)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AsciiBox>
    );
}

export default function Dashboard() {
    const { user, loading } = useAuth();
    const { t, lang } = useI18n();
    const nav = useNavigate();
    const [tab, setTab] = useState('mine');

    useEffect(() => {
        if (!loading && !user) nav('/login');
    }, [loading, user, nav]);

    if (loading || !user) {
        return <p className="p-6 movs-dim" data-testid="dashboard-loading">{t('loading')}...</p>;
    }

    const tabs = [
        { k: 'mine', label: t('tab_mine') },
        { k: 'wallet', label: t('tab_wallet') },
        { k: 'send', label: t('tab_send') },
        { k: 'history', label: t('tab_history') },
    ];

    return (
        <div className="mx-auto max-w-5xl px-3 sm:px-6 py-6 space-y-4" data-testid="page-dashboard">
            <AsciiBox title={`SESSION :: ${user.email}`} testId="box-session">
                <p className="text-sm movs-dim">
                    {lang === 'id' ? 'selamat datang di MOVS, ' : 'welcome to MOVS, '}
                    <span className="movs-accent">{user.email}</span>
                </p>
                <p className="text-xs movs-muted mt-1">
                    addr: <code className="movs-accent">{shortAddr(user.address)}</code>
                </p>
            </AsciiBox>

            <div className="flex flex-wrap gap-2" data-testid="dashboard-tabs">
                {tabs.map((tt) => (
                    <button
                        key={tt.k}
                        onClick={() => setTab(tt.k)}
                        className={`movs-tab ${tab === tt.k ? 'movs-tab--active' : ''}`}
                        data-testid={`dashboard-tab-${tt.k}`}
                    >
                        [ {tt.label} ]
                    </button>
                ))}
            </div>

            {tab === 'mine' && <MineTab />}
            {tab === 'wallet' && <WalletTab />}
            {tab === 'send' && <SendTab />}
            {tab === 'history' && <HistoryTab />}
        </div>
    );
}
