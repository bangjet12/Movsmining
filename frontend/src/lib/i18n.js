import { createContext, useContext, useEffect, useState } from 'react';

const DICT = {
    id: {
        // Brand
        tribute: 'penghargaan untuk reusable proof-of-work hal finney (2004)',
        // Common
        loading: 'memuat',
        error: 'kesalahan',
        ok: 'oke',
        copy: 'salin',
        copied: 'tersalin',
        signin: 'masuk',
        logout: 'keluar',
        cancel: 'batal',
        send: 'kirim',
        // Nav
        nav_home: 'beranda',
        nav_dashboard: 'dasbor',
        nav_leaderboard: 'peringkat',
        nav_explorer: 'penjelajah',
        // Landing
        landing_subtitle: 'jaringan penambangan berbasis browser :: 1,000,000 movs',
        landing_intro:
            'movs adalah jaringan penambangan proof-of-work yang berjalan di browser anda. dapatkan token movs dengan menyumbangkan hash sha-256, kirim ke pengguna lain, dan jelajahi rantai blok. seluruh pasokan dibatasi 1,000,000 dengan halving setiap 10,000 blok.',
        // Network stats
        net_total_supply: 'total pasokan',
        net_minted: 'sudah ditambang',
        net_remaining: 'sisa',
        net_height: 'tinggi blok',
        net_reward: 'reward saat ini',
        net_difficulty: 'kesulitan',
        net_next_halving: 'halving berikut',
        net_miners: 'penambang',
        net_blocks: 'jumlah blok',
        net_last_hash: 'hash terakhir',
        // Login
        login_title: 'masuk',
        login_email_label: '> email :',
        login_email_placeholder: 'anda@contoh.com',
        login_request: 'kirim tautan',
        login_check_inbox: '[oke] periksa kotak masuk anda untuk tautan login',
        login_dev_link: 'mode dev :: tautan langsung',
        login_invalid: '! kesalahan :: alamat email tidak valid',
        login_resend_failed: '! kesalahan :: gagal mengirim email',
        login_back: 'kembali',
        // Verify
        verify_in_progress: 'memverifikasi token',
        verify_success: 'berhasil :: mengarahkan ke dasbor',
        verify_failed: 'verifikasi gagal',
        verify_retry: 'coba lagi',
        // Dashboard tabs
        tab_mine: 'tambang',
        tab_wallet: 'dompet',
        tab_send: 'kirim',
        tab_history: 'riwayat',
        // Wallet
        wallet_address: 'alamat',
        wallet_balance: 'saldo',
        wallet_total_mined: 'total ditambang',
        wallet_blocks_mined: 'blok ditambang',
        // Mining
        mining_start: 'mulai tambang',
        mining_stop: 'hentikan',
        mining_status_idle: 'menganggur',
        mining_status_active: 'aktif',
        mining_hashrate: 'hashrate',
        mining_challenge: 'challenge',
        mining_target: 'target',
        mining_blocks_found: 'blok ditemukan sesi ini',
        mining_log: 'log',
        mining_found: '[blok ditemukan]',
        mining_stale: '[stale] rantai sudah berubah, mengulang',
        mining_invalid: '[err] pow tidak valid',
        // Send
        send_recipient: 'penerima (email atau alamat movs1...)',
        send_amount: 'jumlah',
        send_note: 'catatan (opsional)',
        send_submit: 'kirim',
        send_success: '[oke] transfer berhasil',
        send_error: 'gagal mengirim',
        // History
        history_empty: 'belum ada transaksi',
        history_type: 'tipe',
        history_amount: 'jumlah',
        history_counter: 'pihak',
        history_time: 'waktu',
        // Leaderboard
        lb_title: 'penambang teratas',
        lb_rank: 'peringkat',
        lb_miner: 'penambang',
        lb_total: 'total',
        lb_blocks: 'blok',
        // Explorer
        ex_title: 'blok terbaru',
        ex_height: 'tinggi',
        ex_miner: 'penambang',
        ex_reward: 'reward',
        ex_hash: 'hash',
        ex_time: 'waktu',
        ex_empty: 'belum ada blok ditambang',
    },
    en: {
        tribute: 'a tribute to hal finney\'s reusable proof-of-work (2004)',
        loading: 'loading',
        error: 'error',
        ok: 'ok',
        copy: 'copy',
        copied: 'copied',
        signin: 'sign in',
        logout: 'logout',
        cancel: 'cancel',
        send: 'send',
        nav_home: 'home',
        nav_dashboard: 'dashboard',
        nav_leaderboard: 'leaderboard',
        nav_explorer: 'explorer',
        landing_subtitle: 'browser proof-of-work mining :: 1,000,000 movs cap',
        landing_intro:
            'movs is a browser-based proof-of-work mining network. earn movs by contributing sha-256 hashes, send to other users, and explore the chain. supply capped at 1,000,000 with halving every 10,000 blocks.',
        net_total_supply: 'total supply',
        net_minted: 'mined',
        net_remaining: 'remaining',
        net_height: 'block height',
        net_reward: 'current reward',
        net_difficulty: 'difficulty',
        net_next_halving: 'next halving',
        net_miners: 'miners',
        net_blocks: 'blocks',
        net_last_hash: 'last hash',
        login_title: 'sign in',
        login_email_label: '> email :',
        login_email_placeholder: 'you@example.com',
        login_request: 'send link',
        login_check_inbox: '[ok] check your inbox for the login link',
        login_dev_link: 'dev mode :: direct link',
        login_invalid: '! error :: invalid email address',
        login_resend_failed: '! error :: failed to send email',
        login_back: 'back',
        verify_in_progress: 'verifying token',
        verify_success: 'success :: redirecting to dashboard',
        verify_failed: 'verification failed',
        verify_retry: 'try again',
        tab_mine: 'mine',
        tab_wallet: 'wallet',
        tab_send: 'send',
        tab_history: 'history',
        wallet_address: 'address',
        wallet_balance: 'balance',
        wallet_total_mined: 'total mined',
        wallet_blocks_mined: 'blocks mined',
        mining_start: 'start mining',
        mining_stop: 'stop',
        mining_status_idle: 'idle',
        mining_status_active: 'active',
        mining_hashrate: 'hashrate',
        mining_challenge: 'challenge',
        mining_target: 'target',
        mining_blocks_found: 'blocks found this session',
        mining_log: 'log',
        mining_found: '[block found]',
        mining_stale: '[stale] chain changed, resyncing',
        mining_invalid: '[err] invalid pow',
        send_recipient: 'recipient (email or movs1... address)',
        send_amount: 'amount',
        send_note: 'note (optional)',
        send_submit: 'send',
        send_success: '[ok] transfer complete',
        send_error: 'send failed',
        history_empty: 'no transactions yet',
        history_type: 'type',
        history_amount: 'amount',
        history_counter: 'counterparty',
        history_time: 'time',
        lb_title: 'top miners',
        lb_rank: 'rank',
        lb_miner: 'miner',
        lb_total: 'total',
        lb_blocks: 'blocks',
        ex_title: 'recent blocks',
        ex_height: 'height',
        ex_miner: 'miner',
        ex_reward: 'reward',
        ex_hash: 'hash',
        ex_time: 'time',
        ex_empty: 'no blocks mined yet',
    },
};

const I18nContext = createContext({ lang: 'id', t: (k) => k, setLang: () => {} });

export function I18nProvider({ children }) {
    const [lang, setLangState] = useState(() => localStorage.getItem('movs_lang') || 'id');
    useEffect(() => {
        localStorage.setItem('movs_lang', lang);
        document.documentElement.lang = lang;
    }, [lang]);
    const t = (k) => (DICT[lang] && DICT[lang][k]) || (DICT.en[k] || k);
    const setLang = (l) => setLangState(l);
    return (
        <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
