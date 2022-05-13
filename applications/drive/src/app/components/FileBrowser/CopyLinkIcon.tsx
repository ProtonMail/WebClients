import { useCallback, useState } from 'react';
import { c } from 'ttag';

import { Button, Icon, Tooltip } from '@proton/components';

import { useActions } from '../../store';
import { FileBrowserItem } from './interface';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

const CopyLinkIcon = ({ shareId, item, className }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const { copyShareLinkToClipboard } = useActions();

    const handleGetLink = useCallback(
        (e) => {
            if (!copyShareLinkToClipboard) {
                return;
            }

            setIsLoading(true);
            e.stopPropagation(); // To not show file preview when clicking (to not trigger other click event).
            e.preventDefault(); // To not show file preview when pressing enter (to disable click event).

            copyShareLinkToClipboard(new AbortController().signal, shareId, item.linkId).finally(() => {
                setIsLoading(false);
            });
        },
        [shareId, item]
    );

    if (!copyShareLinkToClipboard || !item.shareUrl || !item.shareId || item.shareUrl.isExpired || item.trashed) {
        return null;
    }

    return (
        <Tooltip title={c('Action').t`Copy link`}>
            <Button
                loading={isLoading}
                icon
                shape="ghost"
                size="small"
                className={className}
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

export default CopyLinkIcon;
