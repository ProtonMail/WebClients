import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';

import type { BrowserItemId } from '../../FileBrowser/interface';
import type { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    shareId: string;
    linkId: BrowserItemId;
    trashed: number | null;
    className?: string;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    isAdmin: boolean;
}

const ShareIcon = ({ shareId, linkId, trashed, className, showLinkSharingModal, isAdmin }: Props) => {
    if (trashed || !isAdmin) {
        return null;
    }

    return (
        <>
            <Tooltip title={c('Action').t`Manage share`}>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className={className}
                    onClick={() => {
                        void showLinkSharingModal({
                            shareId,
                            linkId,
                        });
                    }}
                >
                    <Icon name="users" alt={c('Action').t`Manage share`} />
                </Button>
            </Tooltip>
        </>
    );
};

export default ShareIcon;
