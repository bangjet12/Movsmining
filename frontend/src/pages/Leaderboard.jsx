import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { AsciiBox } from '@/components/ascii';
import { fmtMOVS, shortAddr } from '@/lib/format';

export default function Leaderboard() {
    const { t } = useI18n();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = () => apiClient.get('/leaderboard').then((r) => setItems(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
        load();
        const id = setInterval(load, 12000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="mx-auto max-w-5xl px-3 sm:px-6 py-6" data-testid="page-leaderboard">
            <AsciiBox title={t('lb_title').toUpperCase()} testId="box-leaderboard">
                {loading ? (
                    <p className="movs-dim">{t('loading')}...</p>
                ) : items.length === 0 ? (
                    <p className="movs-muted">no miners yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="movs-table" data-testid="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>{t('lb_rank')}</th>
                                    <th>{t('lb_miner')}</th>
                                    <th className="hidden sm:table-cell">addr</th>
                                    <th className="text-right">{t('lb_total')}</th>
                                    <th className="text-right">{t('lb_blocks')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it) => (
                                    <tr key={it.address} data-testid={`leaderboard-row-${it.rank}`}>
                                        <td className="movs-accent tabular-nums">#{it.rank}</td>
                                        <td>{it.email}</td>
                                        <td className="hidden sm:table-cell movs-muted text-xs">{shortAddr(it.address)}</td>
                                        <td className="text-right tabular-nums movs-accent">{fmtMOVS(it.total_mined, 4)}</td>
                                        <td className="text-right tabular-nums">{it.blocks_mined}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AsciiBox>
        </div>
    );
}
