import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { TableCell } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';

interface AcceptOrRejectInviteCellProps {
    onAccept: () => Promise<void>;
    onReject: () => void;
}
export const AcceptOrRejectInviteCell = ({ onAccept, onReject }: AcceptOrRejectInviteCellProps) => {
    const [isAccepting, withAccepting] = useLoading();
    return (
        <TableCell className="flex flex-nowrap items-center m-0 w-1/6" data-testid="column-share-accept-reject">
            <div className="flex flex-nowrap">
                <Button
                    loading={isAccepting}
                    disabled={isAccepting}
                    className="text-ellipsis"
                    color="norm"
                    shape="ghost"
                    size="small"
                    data-testid="share-accept-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        void withAccepting(onAccept);
                    }}
                >
                    <span className="file-browser-list-item--accept-decline-text">{c('Action').t`Accept`}</span>
                </Button>
                {!isAccepting && (
                    <>
                        <Button
                            className="text-ellipsis file-browser-list-item--decline"
                            color="norm"
                            shape="ghost"
                            size="small"
                            data-testid="share-decline-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void onReject();
                            }}
                        >
                            <span className="file-browser-list-item--accept-decline-text">{c('Action')
                                .t`Decline`}</span>
                        </Button>
                    </>
                )}
            </div>
        </TableCell>
    );
};
