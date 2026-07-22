import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import '../AllChatsHeaderActions.scss';
import './AllChatsMobileBulkActions.scss';

interface AllChatsMobileBulkActionsProps {
    onCancelSelection: () => void;
}

export const AllChatsMobileBulkActions = ({ onCancelSelection }: AllChatsMobileBulkActionsProps) => {
    return (
        <div className="all-chats-mobile-bulk-actions fixed z-50">
            <Button
                shape="solid"
                color="norm"
                size="medium"
                className="all-chats-header-action-button all-chats-header-action-button-primary shrink-0"
                onClick={onCancelSelection}
            >
                {c('collider_2025:Action').t`Cancel`}
            </Button>
        </div>
    );
};
