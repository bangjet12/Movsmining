export function fmtMOVS(n, decimals = 4) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });
}

export function fmtPct(num, total) {
    if (!total) return '0.00%';
    return ((num / total) * 100).toFixed(2) + '%';
}

export function shortHash(h, head = 8, tail = 6) {
    if (!h) return '';
    if (h.length <= head + tail + 3) return h;
    return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function shortAddr(a) {
    return shortHash(a, 8, 6);
}

export function fmtTime(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return iso;
    }
}

export function fmtHashrate(hps) {
    if (!hps || hps <= 0) return '0 h/s';
    if (hps >= 1e6) return (hps / 1e6).toFixed(2) + ' Mh/s';
    if (hps >= 1e3) return (hps / 1e3).toFixed(2) + ' kh/s';
    return hps.toFixed(0) + ' h/s';
}

export function asciiBar(pct, width = 24) {
    const p = Math.max(0, Math.min(1, pct));
    const filled = Math.round(p * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}
