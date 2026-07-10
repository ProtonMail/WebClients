import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

interface ChatMessageFailedActionsProps {
    onRetry: () => void;
    onDiscard: () => void;
}

export const ChatMessageFailedActions = ({ onRetry, onDiscard }: ChatMessageFailedActionsProps) => {
    return (
        <div className="flex items-center gap-2">
            <Button
                shape="solid"
                color="norm"
                size="small"
                pill
                className="retry-button text-sm border"
                onClick={onRetry}
            >
                {c('Action').t`Retry`}
            </Button>
            <Button className="color-hint text-sm" onClick={onDiscard} shape="ghost" size="small" pill>
                {c('Action').t`Discard`}
            </Button>
        </div>
    );
};
