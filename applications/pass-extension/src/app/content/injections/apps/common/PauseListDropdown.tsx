import { type FC } from 'react';

import { type IFrameCloseOptions } from 'proton-pass-extension/app/content/types/iframe';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { type CriteriaMasks } from '@proton/pass/types/worker/settings';

type Props = {
    criteria: CriteriaMasks;
    hostname: string;
    label: string;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
};
export const PauseListDropdown: FC<Props> = ({ criteria, hostname, label, visible, onClose }) => {
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
            color="weak"
            shape="solid"
        >
            <DropdownMenuButton onClick={addToPauseList} label={label} ellipsis={false} />
        </QuickActionsDropdown>
    );
};
