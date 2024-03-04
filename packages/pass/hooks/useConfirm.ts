import { useCallback, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';

/**
 * The `useConfirm` hook lets you manage and confirm the execution of a callback.
 * It allows you to initiate an action, confirm it when ready, and cancel it if
 * necessary. This hook is particularly useful when you want to confirm a potentially
 * destructive action, such as deleting an item, before executing it. Typically you
 * would use the `pending` state to toggle the visiblity of a prompt, ie :
 *
 * ```typescript
 * const action = useConfirm((id: string) => items.remove(id))
 * // call `action.prompt('some-id')` to initiate
 *
 * <Prompt
 *   open={action.pending}
 *   onClose={action.cancel}
 *   onSubmit={action.confirm}
 * />
 * ```
 */
export const useConfirm = <P extends any, R extends any>(action: (param: P) => R) => {
    const [param, setParam] = useState<MaybeNull<P>>(null);

    const confirm = useCallback(() => {
        if (param === null) {
            console.warn('No pending action');
            return;
        }

        return action(param);
    }, [param, action]);

    const cancel = useCallback(() => setParam(null), []);

    return {
        param,
        pending: param !== null,
        cancel,
        confirm,
        prompt: setParam,
    };
};
