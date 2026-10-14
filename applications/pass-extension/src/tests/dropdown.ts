import { DropdownAction } from '../app/content/constants.runtime';
import type { FieldHandle } from '../app/content/services/form/field';
import { intoDropdownAction } from '../app/content/services/inline/dropdown/dropdown.utils';
import { contentScriptMessage, sendMessage } from '../lib/message/send-message';
import { WorkerMessageType } from '../types/messages';

type LoginCandidate = { itemId: string; shareId: string; name: string; userIdentifier: string };

/** Stands in for the dropdown iframe app: builds the same request payload
 * from the focused field, queries candidates and sends the selection. */
export const openLoginDropdown = async (field: FieldHandle) => {
    const payload = await intoDropdownAction({
        type: 'field',
        field,
        action: DropdownAction.AUTOFILL_LOGIN,
        autofocused: false,
        autofilled: false,
    });

    if (payload?.action !== DropdownAction.AUTOFILL_LOGIN) throw new Error('Login dropdown cannot open on this field');

    const result = await sendMessage(
        contentScriptMessage({ type: WorkerMessageType.AUTOFILL_LOGIN_QUERY, payload: { frameId: payload.frameId } })
    );

    if (result.type !== 'success') throw new Error('Login candidates query failed');

    return {
        candidates: result.items as LoginCandidate[],
        select: ({ itemId, shareId }: LoginCandidate) =>
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_ACTION,
                    payload: { ...payload, type: 'login', itemId, shareId },
                })
            ),
    };
};
