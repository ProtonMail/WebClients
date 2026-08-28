import type { FC } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { MODEL_VERSION } from '@proton/pass/constants';
import type { CriteriaMasks } from '@proton/pass/lib/settings/pause-list';
import type { AutofillPageTelemetryDimensions } from '@proton/pass/types/data/telemetry';
import { NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS, TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { WorkerMessageType } from '../../../types/messages';
import { contentScriptMessage, sendMessage } from '../../message/send-message';
import { useIFrameAppController, useIFrameAppState } from './IFrameApp';

type Props = {
    criteria: CriteriaMasks;
    dense?: boolean;
    hostname: string;
    label: string;
    telemetry?: AutofillPageTelemetryDimensions;
};

export const PauseListDropdown: FC<Props> = ({
    criteria,
    dense,
    hostname,
    label,
    // only the 'Autosave' criteria uses this; other callers don't pass real page telemetry
    telemetry = NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS,
}) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const { onTelemetry } = usePassCore();

    const addToPauseList = () => {
        if (hostname) {
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.PAUSE_WEBSITE,
                    payload: { hostname, criteria },
                })
            );
        }

        switch (criteria) {
            case 'Autosave': {
                onTelemetry(
                    TelemetryEventName.AutosaveDismissed,
                    {},
                    {
                        dismissReason: 'disable',
                        modelVersion: MODEL_VERSION,
                        ...telemetry,
                    }
                );
                break;
            }
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
