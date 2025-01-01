import { type FC } from 'react';

import {
    useIFrameAppController,
    useIFrameAppState,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
import { type CriteriaMasks } from '@proton/pass/types/worker/settings';

type Props = {
    criteria: CriteriaMasks;
    dense?: boolean;
    hostname: string;
    label: string;
};
export const PauseListDropdown: FC<Props> = ({ criteria, dense, hostname, label }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();

    const addToPauseList = () => {
        if (hostname) {
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.PAUSE_WEBSITE,
                    payload: { hostname, criteria },
                })
            );
        }

        controller.close();
    };

    return (
        <QuickActionsDropdown
            /* Trick to re-render this component so that quickActions
             * dropdown is closed when iframe visibility changes */
            key={`item-quick-actions-dropdown-${visible}`}
            color="weak"
            originalPlacement="bottom-end"
            shape="solid"
            {...(dense
                ? {
                      className: 'shrink-0 button-xs',
                      iconSize: 3,
                      menuClassName: 'text-sm',
                      offset: 2,
                      size: 'small',
                  }
                : { size: 'small', iconSize: 4.5, className: 'shrink-0' })}
        >
            <DropdownMenuButton onClick={addToPauseList} label={label} ellipsis={false} />
        </QuickActionsDropdown>
    );
};
