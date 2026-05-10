/* eslint-disable no-restricted-globals */
// MOVS Mining Worker
// Performs SHA-256 PoW: find nonce such that
//   sha256(`${prevHash}|${address}|${height}|${nonce}`) (as 256-bit int) < target
// Reports hashrate periodically via 'progress' messages.
// Reports 'found' when a valid nonce is discovered.

// --- Pure-JS SHA-256 (fast path, no async crypto.subtle round-trips) ---
// Adapted from public-domain reference; ASCII-only inputs OK.
function sha256(asciiStr) {
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    // Pre-processing: convert ASCII string to bytes
    const len = asciiStr.length;
    const bitLen = len * 8;
    // Padded length to multiple of 64 bytes (after appending 0x80 + length(8 bytes))
    const paddedLen = (((len + 9) + 63) >> 6) << 6;
    const msg = new Uint8Array(paddedLen);
    for (let i = 0; i < len; i++) msg[i] = asciiStr.charCodeAt(i) & 0xff;
    msg[len] = 0x80;
    // length in bits as 64-bit big-endian (we only fill last 8 bytes)
    msg[paddedLen - 4] = (bitLen >>> 24) & 0xff;
    msg[paddedLen - 3] = (bitLen >>> 16) & 0xff;
    msg[paddedLen - 2] = (bitLen >>> 8) & 0xff;
    msg[paddedLen - 1] = bitLen & 0xff;

    // Initial hash values
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    const w = new Int32Array(64);

    for (let chunk = 0; chunk < paddedLen; chunk += 64) {
        for (let i = 0; i < 16; i++) {
            const j = chunk + i * 4;
            w[i] = (msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3];
        }
        for (let i = 16; i < 64; i++) {
            const x = w[i - 15];
            const y = w[i - 2];
            const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
            const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, hh = h7;
        for (let i = 0; i < 64; i++) {
            const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            const ch = (e & f) ^ (~e & g);
            const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
            const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            const mj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + mj) | 0;
            hh = g; g = f; f = e; e = (d + t1) | 0;
            d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + hh) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7];
}

function toHex(words) {
    let out = '';
    for (let i = 0; i < words.length; i++) {
        out += ('00000000' + (words[i] >>> 0).toString(16)).slice(-8);
    }
    return out;
}

// Returns true if SHA-256 hash satisfies difficulty (leading bits zero)
function meetsTarget(words, difficultyBits) {
    let bits = difficultyBits;
    for (let i = 0; i < 8 && bits > 0; i++) {
        const w = words[i] >>> 0;
        if (bits >= 32) {
            if (w !== 0) return false;
            bits -= 32;
        } else {
            // Top `bits` of this 32-bit word must be zero
            const shift = 32 - bits;
            if ((w >>> shift) !== 0) return false;
            return true;
        }
    }
    return true;
}

let running = false;
let job = null;

self.onmessage = (ev) => {
    const msg = ev.data;
    if (msg.cmd === 'start') {
        job = msg.job; // {prevHash, address, height, difficultyBits, startNonce}
        running = true;
        runLoop();
    } else if (msg.cmd === 'stop') {
        running = false;
    } else if (msg.cmd === 'updateJob') {
        job = msg.job;
    }
};

function runLoop() {
    if (!job) return;
    let nonce = job.startNonce || 0;
    const prefix = `${job.prevHash}|${job.address}|${job.height}|`;
    const diff = job.difficultyBits;
    const reportEvery = 50000;
    let lastReport = performance.now();
    let hashesSinceReport = 0;

    function step() {
        if (!running) return;
        const batchEnd = nonce + 8000;
        for (; nonce < batchEnd; nonce++) {
            const words = sha256(prefix + nonce);
            if (meetsTarget(words, diff)) {
                running = false;
                self.postMessage({
                    type: 'found',
                    nonce,
                    hash: toHex(words),
                    height: job.height,
                    prevHash: job.prevHash,
                });
                return;
            }
        }
        hashesSinceReport += 8000;
        const now = performance.now();
        if (hashesSinceReport >= reportEvery) {
            const elapsed = (now - lastReport) / 1000;
            const hps = elapsed > 0 ? hashesSinceReport / elapsed : 0;
            self.postMessage({ type: 'progress', hps, nonce });
            hashesSinceReport = 0;
            lastReport = now;
        }
        // Yield to event loop to keep UI responsive (and check stop signal)
        setTimeout(step, 0);
    }
    step();
}
