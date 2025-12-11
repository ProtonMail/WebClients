import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import clsx from '@proton/utils/clsx';

import type { CellDefinition } from '../../../statelessComponents/DriveExplorer/types';
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
    const [isAccepting, withAccepting] = useLoading();

    return (
        <div className={clsx('flex flex-nowrap', className)}>
            <Button
                loading={isAccepting}
                disabled={isAccepting}
                className="text-ellipsis"
                color="norm"
                shape="ghost"
                size="small"
                data-testid="share-accept-button"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    void withAccepting(async () => {
                        await onAcceptInvitation(uid, invitationUid);
                    });
                }}
            >
                <span className="file-browser-list-item--accept-decline-text">{c('Action').t`Accept`}</span>
            </Button>
            {!isAccepting && (
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
