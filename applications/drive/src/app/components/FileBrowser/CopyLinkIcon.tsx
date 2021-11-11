import { useCallback, useState } from 'react';
import { c } from 'ttag';

import { Button, Icon, Tooltip } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useSharing from '../../hooks/drive/useSharing';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

const GetLinkIcon = ({ shareId, item, className }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const { copyShareLinkToClipboard } = useSharing();

    const handleGetLink = useCallback(
        (e) => {
            if (!copyShareLinkToClipboard) {
                return;
            }

            setIsLoading(true);
            e.stopPropagation(); // To not show file preview when clicking (to not trigger other click event).
            e.preventDefault(); // To not show file preview when pressing enter (to disable click event).

            copyShareLinkToClipboard(item.ShareUrlShareID as string).finally(() => {
                setIsLoading(false);
            });
        },
        [shareId, item]
    );

    if (!copyShareLinkToClipboard || !item.SharedUrl || !item.ShareUrlShareID || item.UrlsExpired || item.Trashed) {
        return <></>;
    }

    return (
        <Tooltip title={c('Action').t`Copy link`}>
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
                <Icon name="link" alt={c('Action').t`Copy link`} />
            </Button>
        </Tooltip>
    );
};

export default GetLinkIcon;
