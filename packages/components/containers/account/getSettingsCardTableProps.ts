import type { CSSProperties } from 'react';

const style: CSSProperties = {
    '--table-padding': 'var(--space-4)',
    '--table-stacked-padding-inline': 'var(--table-padding)',
    '--table-stacked-padding-block-start': 'var(--table-padding)',
};

/**
 * Props for a table that fills a flush settings card (`SettingsCardSection flush`), matching
 * the group membership table: weak borders, no border under the last row and no bottom
 * margin, roomier cells, and stacked rows on narrow screens.
 */
export const getSettingsCardTableProps = () => ({
    borderWeak: true,
    lastRowNoBorder: true,
    responsive: 'stacked' as const,
    className: 'mb-0',
    style,
});
