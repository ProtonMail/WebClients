import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { IconComponent } from '@proton/icons/component';

interface Props {
    icon: IconComponent;
    text: string;
    tooltipText: string;
    onClickRefineAction: () => void;
    disabled?: boolean;
}

const ComposerAssistantQuickAction = ({ icon: Icon, text, onClickRefineAction, tooltipText, disabled }: Props) => {
    return (
        <Tooltip title={tooltipText}>
            <Button
                onClick={onClickRefineAction}
                shape="ghost"
                className="composer-assistant-refine-button mx-1"
                size="small"
                disabled={disabled}
            >
                <Icon className="composer-assistant-special-color mr-1" />
                {text}
            </Button>
        </Tooltip>
    );
};

export default ComposerAssistantQuickAction;
