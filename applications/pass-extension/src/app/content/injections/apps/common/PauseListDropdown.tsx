import { type FC } from 'react';

import { type IFrameCloseOptions } from 'proton-pass-extension/app/content/types/iframe';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { type CriteriaMasks } from '@proton/pass/types/worker/settings';

type Props = {
    criteria: CriteriaMasks;
    dense?: boolean;
    hostname: string;
    label: string;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
};
export const PauseListDropdown: FC<Props> = ({ criteria, dense, hostname, label, visible, onClose }) => {
    const addToPauseList = () => {
        if (hostname) {
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.PAUSE_WEBSITE,
                    payload: { hostname, criteria },
                })
            );
        }

        onClose?.();
    };

    return (
        <QuickActionsDropdown
            /* Trick to re-render this component so that quickActions
             * dropdown is closed when iframe visibility changes */
            key={`item-quick-actions-dropdown-${visible}`}
            className="flex-item-noshrink"
            color="weak"
            originalPlacement="bottom-end"
            shape="solid"
            {...(dense ? { size: 'small', iconSize: 10, offset: 2, menuClassName: 'text-xs' } : { iconSize: 16 })}
        >
            <DropdownMenuButton onClick={addToPauseList} label={label} ellipsis={false} />
        </QuickActionsDropdown>
    );
};
