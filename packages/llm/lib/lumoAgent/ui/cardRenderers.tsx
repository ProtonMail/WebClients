import { useState } from 'react';

import { c } from 'ttag';

import { IcPencil } from '@proton/icons/icons/IcPencil';
import { ConfirmCardShell } from '@proton/lumo-ui';

import type { ActionRequest, ReferenceLabels } from '../contracts/types';
import type { CardRenderer } from './types';

/**
 * Fallback used for a mutation whose product registered no bespoke renderer: a plain confirm showing
 * the tool name, no editable body. Keeps the panel functional before every card is authored.
 */
export const defaultCardRenderer: CardRenderer = {
    icon: IcPencil,
    sentence: (action) => action.type,
};

/** The action's params (everything but the `type` discriminator). */
const paramsOf = (action: ActionRequest): Record<string, any> =>
    Object.fromEntries(Object.entries(action).filter(([key]) => key !== 'type'));

/**
 * The action as the card currently stands, so `sentence` describes what Confirm would apply rather
 * than what was proposed. The same shape the hook stores once the card settles, which is what keeps
 * the card and its result tile saying the same thing.
 */
const asEdited = (action: ActionRequest, params: Record<string, any>): ActionRequest =>
    ({ ...params, type: action.type }) as ActionRequest;

interface Props {
    renderer: CardRenderer;
    action: ActionRequest;
    labels: ReferenceLabels;
    onApply: (params: Record<string, any>) => void;
    onCancel: () => void;
}

/**
 * The pending confirm card: mounts the renderer's body (if any) in the shared {@link ConfirmCardShell}
 * and wires apply/cancel. Apply/cancel resolve the executor's `ConfirmController` promise (confirm
 * happens inside the transport's `execute()`), not an engine resume.
 */
const ConfirmCard = ({ renderer, action, labels, onApply, onCancel }: Props) => {
    const [params, setParams] = useState<Record<string, any>>(() => paramsOf(action));

    return (
        <ConfirmCardShell
            icon={renderer.icon}
            sentence={renderer.sentence(asEdited(action, params), labels)}
            applyLabel={c('Action').t`Confirm`}
            cancelLabel={c('Action').t`Cancel`}
            applyDisabled={renderer.canApply ? !renderer.canApply(params) : undefined}
            onApply={() => onApply(params)}
            onCancel={onCancel}
        >
            {renderer.renderBody?.({ action, labels, params, onChange: setParams })}
        </ConfirmCardShell>
    );
};

export default ConfirmCard;
