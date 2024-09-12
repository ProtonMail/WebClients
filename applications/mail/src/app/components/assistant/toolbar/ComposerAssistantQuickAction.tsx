import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components';
import { Icon, Tooltip } from '@proton/components';

interface Props {
    icon: IconName;
    text: string;
    tooltipText: string;
    onClickRefineAction: () => void;
    disabled?: boolean;
}

const ComposerAssistantQuickAction = ({ icon, text, onClickRefineAction, tooltipText, disabled }: Props) => {
    return (
        <Tooltip title={tooltipText}>
            <Button
                onClick={onClickRefineAction}
                shape="ghost"
                className="composer-assistant-refine-button mx-1"
                size="small"
                disabled={disabled}
            >
                <Icon name={icon} className="composer-assistant-special-color mr-1" />
                {text}
            </Button>
        </Tooltip>
    );
};

export default ComposerAssistantQuickAction;
