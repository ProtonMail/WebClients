import { useSyncExternalStore } from 'react';

import { c } from 'ttag';

import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { ConfirmCardShell } from '@proton/lumo-ui';

import {
    clearSuspendedChain,
    getSuspendedChains,
    subscribeSuspendedChains,
} from '../../../../../services/generation/toolBudgetStore';
import type { ConversationId } from '../../../../../types';
import ChatContainerItem from '../../../../ChatContainerItem';

import '@proton/lumo-ui/lumo-ui.scss';

/**
 * Shown when the tool loop ran out of rounds before the model finished
 */
const ToolBudgetCard = ({ conversationId }: { conversationId?: ConversationId }) => {
    const suspendedChains = useSyncExternalStore(subscribeSuspendedChains, getSuspendedChains);
    const suspension = conversationId
        ? suspendedChains.find((entry) => entry.conversationId === conversationId)
        : undefined;

    if (!suspension) {
        return null;
    }

    return (
        <ChatContainerItem className="lumo-tool-budget px-6 md:px-0 pb-2">
            <div className="flex flex-column flex-nowrap gap-3 w-full">
                <ConfirmCardShell
                    icon={IcHourglass}
                    sentence={c('collider_2025: Info').t`This is taking a lot of steps. Should it carry on?`}
                    applyLabel={c('collider_2025: Action').t`Keep going`}
                    cancelLabel={c('collider_2025: Action').t`Stop here`}
                    onApply={() => {
                        suspension.resume().catch(() => {});
                    }}
                    onCancel={() => clearSuspendedChain(suspension.conversationId)}
                />
            </div>
        </ChatContainerItem>
    );
};

export default ToolBudgetCard;
