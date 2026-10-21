import { useCallback, useState } from 'react';

import { c } from 'ttag';
import type { View } from 'vega-typings';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { LumoIcon } from '../../LumoIcon/LumoIcon';

interface VegaChartDownloadButtonProps {
    getView: () => View | null | undefined;
    filename: string;
}

export const VegaChartDownloadButton = ({ getView, filename }: VegaChartDownloadButtonProps) => {
    const { createNotification } = useNotifications();
    const [isDownloading, setIsDownloading] = useState(false);
    const downloadLabel = c('Action').t`Download chart`;

    const handleDownload = useCallback(async () => {
        const view = getView();
        if (!view) {
            return;
        }

        setIsDownloading(true);
        try {
            const canvas = await view.toCanvas(2);
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Failed to encode chart as PNG'));
                    }
                }, 'image/png');
            });
            await triggerFileDownload(blob, filename, 'image');
        } catch (error) {
            createNotification({ type: 'error', text: c('Error').t`Failed to download chart. Please try again.` });
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[VegaChartDownloadButton] Failed to export chart:', error);
            }
        } finally {
            setIsDownloading(false);
        }
    }, [filename, getView, createNotification]);

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
