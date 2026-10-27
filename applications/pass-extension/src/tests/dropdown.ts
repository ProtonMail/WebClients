import { DropdownAction } from '../app/content/constants.runtime';
import type { FieldHandle } from '../app/content/services/form/field';
import { intoDropdownAction } from '../app/content/services/inline/dropdown/dropdown.utils';
import { contentScriptMessage, sendMessage } from '../lib/message/send-message';
import { WorkerMessageType } from '../types/messages';

type Candidate = { itemId: string; shareId: string; name: string };
type LoginCandidate = Candidate & { userIdentifier: string };

type DropdownConfig = {
    action: DropdownAction.AUTOFILL_LOGIN | DropdownAction.AUTOFILL_IDENTITY | DropdownAction.AUTOFILL_CC;
    type: 'login' | 'identity' | 'creditCard';
    query: (frameId: number) => Parameters<typeof contentScriptMessage>[0];
};

/** Stands in for the dropdown iframe app: builds the same request payload
 * from the focused field, queries candidates and sends the selection. */
const openDropdown = async <T extends Candidate>(field: FieldHandle, { action, type, query }: DropdownConfig) => {
    if (field.action?.type !== action) throw new Error(`${type} dropdown cannot open on this field`);

    const payload = await intoDropdownAction({ type: 'field', field, action, autofocused: false, autofilled: false });
    if (payload?.action !== action) throw new Error(`${type} dropdown request could not be built`);

    const result = await sendMessage(contentScriptMessage(query(payload.frameId)));
    if (result.type !== 'success' || !('items' in result)) throw new Error(`${type} candidates query failed`);

    return {
        candidates: result.items as T[],
        select: ({ itemId, shareId }: T) =>
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_ACTION,
                    payload: { ...payload, type, itemId, shareId },
                })
            ),
    };
};

export const openLoginDropdown = (field: FieldHandle) =>
    openDropdown<LoginCandidate>(field, {
        action: DropdownAction.AUTOFILL_LOGIN,
        type: 'login',
        query: (frameId) => ({ type: WorkerMessageType.AUTOFILL_LOGIN_QUERY, payload: { frameId } }),
    });

export const openIdentityDropdown = (field: FieldHandle) =>
    openDropdown(field, {
        action: DropdownAction.AUTOFILL_IDENTITY,
        type: 'identity',
        query: () => ({ type: WorkerMessageType.AUTOFILL_IDENTITY_QUERY }),
    });

export const openCreditCardDropdown = (field: FieldHandle) =>
    openDropdown(field, {
        action: DropdownAction.AUTOFILL_CC,
        type: 'creditCard',
        query: () => ({ type: WorkerMessageType.AUTOFILL_CC_QUERY }),
    });
