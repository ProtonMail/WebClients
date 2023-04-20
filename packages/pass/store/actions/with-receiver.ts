import { AnyAction } from 'redux';

import { ExtensionEndpoint, TabId } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object';

export type WithReceiverOptions = { receiver?: ExtensionEndpoint; tabId?: TabId };
export type WithReceiverAction<T = AnyAction> = T & { meta: WithReceiverOptions };

/* type guard utility */
export const isActionWithReceiver = <T extends AnyAction>(action?: T): action is WithReceiverAction<T> => {
    const { meta } = action as any;
    return meta?.receiver !== undefined || meta?.tabId !== undefined;
};

export const acceptActionWithReceiver = (action: AnyAction, receiver: ExtensionEndpoint, tabId?: TabId) => {
    if (isActionWithReceiver(action)) {
        const { meta } = action;
        return (
            (meta.receiver === undefined || meta.receiver === receiver) &&
            (meta.tabId === undefined || meta.tabId === tabId)
        );
    }

    return true;
};

const withReceiver =
    (options: WithReceiverOptions) =>
    <T extends object>(action: T): WithReceiverAction<T> =>
        merge(action, { meta: options });

export default withReceiver;
