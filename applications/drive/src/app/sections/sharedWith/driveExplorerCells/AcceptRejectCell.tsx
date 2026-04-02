import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import type { CellDefinition } from '../../../statelessComponents/DriveExplorer/types';
import { ItemType, useSharedWithMeStore } from '../useSharedWithMe.store';
import { defaultSharedOnCellConfig } from './SharedOnCell';

export interface AcceptRejectCellProps {
    uid: string;
    invitationUid: string;
    onAcceptInvitation: (uid: string, invitationUid: string) => Promise<void>;
    onRejectInvitation: (uid: string, invitationUid: string) => Promise<void>;
    className?: string;
}

export const AcceptRejectCell = ({
    uid,
    invitationUid,
    onAcceptInvitation,
    onRejectInvitation,
    className,
}: AcceptRejectCellProps) => {
    const isBeingAccepted = useSharedWithMeStore(
        useShallow((state) => {
            const item = state.getSharedWithMeItem(uid);
            if (item?.itemType !== ItemType.INVITATION) {
                return false;
            }
            return item.isBeingAccepted ?? false;
        })
    );

    return (
        <div className={clsx('flex flex-nowrap', className)}>
            <Button
                loading={isBeingAccepted}
                disabled={isBeingAccepted}
                className="text-ellipsis"
                color="norm"
                shape="ghost"
                size="small"
                data-testid="share-accept-button"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    void onAcceptInvitation(uid, invitationUid);
                }}
            >
                <span className="file-browser-list-item--accept-decline-text">{c('Action').t`Accept`}</span>
            </Button>
            {!isBeingAccepted && (
                <Button
                    className="text-ellipsis file-browser-list-item--decline"
                    color="norm"
                    shape="ghost"
                    size="small"
                    data-testid="share-decline-button"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        void onRejectInvitation(uid, invitationUid);
                    }}
                >
                    <span className="file-browser-list-item--accept-decline-text">{c('Action').t`Decline`}</span>
                </Button>
            )}
        </div>
    );
};

// For now the Accept/Decline is in the same cell
export const defaultAcceptRejectCellConfig: Omit<CellDefinition, 'render'> = defaultSharedOnCellConfig;
