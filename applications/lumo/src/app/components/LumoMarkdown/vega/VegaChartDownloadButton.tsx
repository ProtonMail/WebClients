import { useCallback, useState } from 'react';

import { c } from 'ttag';
import type { View } from 'vega-typings';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { LumoIcon } from '../../LumoIcon/LumoIcon';

interface VegaChartDownloadButtonProps {
    getView: () => View | null | undefined;
    filename: string;
}

function triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
}

export const VegaChartDownloadButton = ({ getView, filename }: VegaChartDownloadButtonProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const downloadLabel = c('Action').t`Download chart`;

    const handleDownload = useCallback(async () => {
        const view = getView();
        if (!view) {
            return;
        }

        setIsDownloading(true);
        try {
            const url = await view.toImageURL('png', 2);
            triggerDownload(url, filename);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[VegaChartDownloadButton] Failed to export chart:', error);
            }
        } finally {
            setIsDownloading(false);
        }
    }, [filename, getView]);

    return (
        <Tooltip title={downloadLabel}>
            <Button
                icon
                color="weak"
                shape="ghost"
                size="small"
                loading={isDownloading}
                aria-label={downloadLabel}
                className="vega-lite-chart__action-button"
                onClick={(event) => {
                    event.stopPropagation();
                    void handleDownload();
                }}
            >
                <LumoIcon name="ArrowDownToLine" size={16} />
            </Button>
        </Tooltip>
    );
};
