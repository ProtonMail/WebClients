import { useCallback, useState } from 'react';
import { c } from 'ttag';

import { Button, Icon, Tooltip, useNotifications } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useSharing from '../../hooks/drive/useSharing';
import { getSharedLink } from '../../utils/link';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

const GetLinkIcon = ({ shareId, item, className }: Props) => {
    const [isLoading, setIsLoading] = useState(false);

    const { createNotification } = useNotifications();
    const { getSharedURLs, decryptSharedLink } = useSharing();

    const handleGetLink = useCallback(
        (e) => {
            setIsLoading(true);
            e.stopPropagation(); // To not show file preview when clicking (to not trigger other click event).
            e.preventDefault(); // To not show file preview when pressing enter (to disable click event).

            getSharedURLs(item.ShareUrlShareID as string)
                .then(async ({ ShareURLs: [sharedUrl] }) => {
                    return decryptSharedLink(sharedUrl);
                })
                .then(({ ShareURL }) => {
                    const url = getSharedLink(ShareURL);
                    textToClipboard(url);
                    createNotification({
                        text: c('Info').t`Link copied to clipboard`,
                    });
                })
                .catch((err: any) => {
                    console.error(err);
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Failed to load the link`,
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        },
        [shareId, item]
    );

    if (!item.SharedUrl || !item.ShareUrlShareID || item.UrlsExpired || item.Trashed) {
        return <></>;
    }

    return (
        <Tooltip title={c('Action').t`Get link`}>
            <Button
                loading={isLoading}
                icon
                shape="ghost"
                size="small"
                className={className || 'flex flex-item-noshrink'}
                onClick={handleGetLink}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleGetLink(e);
                    }
                }}
            >
                <Icon name="link" alt={c('Action').t`Get link`} />
            </Button>
        </Tooltip>
    );
};

export default GetLinkIcon;
