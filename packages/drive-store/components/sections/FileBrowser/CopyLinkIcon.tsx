import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import noop from '@proton/utils/noop';

import { useActions } from '../../../store';
import type { BrowserItemId } from '../../FileBrowser/interface';

interface Props {
    shareId: string;
    linkId: BrowserItemId;
    trashed: number | null;
    isExpired: boolean;
    className?: string;
}

const CopyLinkIcon = ({ shareId, linkId, trashed, isExpired, className }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const { copyShareLinkToClipboard } = useActions();

    const handleGetLink = useCallback(
        (e: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
            if (!copyShareLinkToClipboard) {
                return;
            }

            setIsLoading(true);
            e.stopPropagation(); // To not show file preview when clicking (to not trigger other click event).
            e.preventDefault(); // To not show file preview when pressing enter (to disable click event).

            copyShareLinkToClipboard(new AbortController().signal, shareId, linkId)
                .finally(() => {
                    setIsLoading(false);
                })
                .catch(noop);
        },
        [shareId, linkId]
    );

    if (!copyShareLinkToClipboard || isExpired || trashed) {
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
