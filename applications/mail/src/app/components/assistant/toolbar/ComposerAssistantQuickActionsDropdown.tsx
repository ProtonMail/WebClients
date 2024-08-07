import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Dropdown,
    DropdownButton,
    DropdownMenuButton,
    Icon,
    Tooltip,
    usePopperAnchor,
} from '@proton/components/components';
import { useActiveBreakpoint } from '@proton/components/hooks';
import type { ActionType } from '@proton/llm/lib/types';

interface Props {
    onClickRefineAction: (actionType: ActionType) => void;
    disabled?: boolean;
}

const ComposerAssistantQuickActionsDropdown = ({ onClickRefineAction, disabled }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <Tooltip title={c('Info').t`More refine actions`}>
                <DropdownButton
                    as={Button}
                    type="button"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    className="mx-2 composer-assistant-refine-button"
                    size="small"
                    shape="ghost"
                    icon
                    disabled={disabled}
                >
                    <Icon name="three-dots-horizontal" alt={c('Action').t`More refine actions`} />
                </DropdownButton>
            </Tooltip>
            <Dropdown autoClose autoCloseOutside isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                {viewportWidth.xsmall && (
                    <>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center text-sm"
                            onClick={() => {
                                onClickRefineAction('proofread');
                            }}
                        >
                            {c('Action').t`Proofread`}
                        </DropdownMenuButton>
                    </>
                )}
                {viewportWidth['<=small'] && (
                    <>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center text-sm"
                            onClick={() => {
                                onClickRefineAction('expand');
                            }}
                        >
                            {c('Action').t`Expand`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center text-sm"
                            onClick={() => {
                                onClickRefineAction('shorten');
                            }}
                        >
                            {c('Action').t`Shorten`}
                        </DropdownMenuButton>
                    </>
                )}
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center text-sm"
                    onClick={() => {
                        onClickRefineAction('formal');
                    }}
                >
                    {c('Action').t`Formalize`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center text-sm"
                    onClick={() => {
                        onClickRefineAction('friendly');
                    }}
                >
                    {c('Action').t`Make it friendly`}
                </DropdownMenuButton>
            </Dropdown>
        </>
    );
};

export default ComposerAssistantQuickActionsDropdown;
