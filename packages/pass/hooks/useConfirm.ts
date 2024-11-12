import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';

import type { Maybe, MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

type UseConfirmResult<P, R> = {
    call: (param: P) => R;
    cancel: () => void;
    confirm: () => Maybe<R>;
    prompt: Dispatch<SetStateAction<MaybeNull<P>>>;
} & ({ pending: true; param: P } | { pending: false; param: null });

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

    const cancel = useCallback(() => setParam(null), []);
    const confirm = useCallback(pipe(param ? () => action(param) : noop, tap(cancel)), [param, action]);

    return {
        param,
        pending: param !== null,
        call: action,
        cancel,
        confirm,
        prompt: setParam,
    } as UseConfirmResult<P, R>;
};
