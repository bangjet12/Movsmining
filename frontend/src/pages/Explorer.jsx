import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { AsciiBox, CopyButton } from '@/components/ascii';
import { fmtMOVS, shortHash, shortAddr, fmtTime } from '@/lib/format';

export default function Explorer() {
    const { t } = useI18n();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = () => apiClient.get('/blocks/recent?limit=40').then((r) => setItems(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
        load();
        const id = setInterval(load, 8000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="mx-auto max-w-5xl px-3 sm:px-6 py-6" data-testid="page-explorer">
            <AsciiBox title={t('ex_title').toUpperCase()} testId="box-explorer">
                {loading ? (
                    <p className="movs-dim">{t('loading')}...</p>
                ) : items.length === 0 ? (
                    <p className="movs-muted">{t('ex_empty')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="movs-table" data-testid="recent-blocks-table">
                            <thead>
                                <tr>
                                    <th>{t('ex_height')}</th>
                                    <th>{t('ex_miner')}</th>
                                    <th className="text-right">{t('ex_reward')}</th>
                                    <th className="hidden md:table-cell">{t('ex_hash')}</th>
                                    <th>{t('ex_time')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((b) => (
                                    <tr key={b.id || b.hash} data-testid={`block-row-${b.height}`}>
                                        <td className="movs-accent tabular-nums">#{b.height}</td>
                                        <td className="truncate-mono max-w-[16ch] sm:max-w-none">
                                            <span className="movs-dim text-xs">{shortAddr(b.miner_address)}</span>
                                        </td>
                                        <td className="text-right tabular-nums movs-accent">{fmtMOVS(b.reward, 4)}</td>
                                        <td className="hidden md:table-cell">
                                            <code className="text-xs">{shortHash(b.hash, 10, 8)}</code>
                                            <CopyButton value={b.hash} testId={`block-hash-copy-${b.height}`} />
                                        </td>
                                        <td className="movs-muted text-xs">{fmtTime(b.timestamp)}</td>
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
