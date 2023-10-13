import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import type { FormikTouched } from 'formik';
import { type FormikContextType } from 'formik';

import { itemDraftDiscard, itemDraftSave } from '@proton/pass/store/actions';
import type { ItemDraft } from '@proton/pass/store/reducers';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { omit } from '@proton/shared/lib/helpers/object';
import debounce from '@proton/utils/debounce';

const SAVE_DRAFT_TIMEOUT = 500;

export type ItemDraftState<V extends {} = {}> = Maybe<{ draft?: ItemDraft<V> }>;

type UseItemDraftOptions<V extends {}> = Pick<ItemDraft, 'type' | 'mode' | 'itemId' | 'shareId'> & {
    /* Apply sanitization over the draft values */
    sanitizeHydration?: (formData: ItemDraft<V>['formData']) => ItemDraft<V>['formData'];
    sanitizeSave?: (formData: ItemDraft<V>['formData']) => ItemDraft<V>['formData'];
    /* Retrieve the sanitized draft values after form hydration.
     * This may be useful when chaining multiple form `setValue`
     * calls inside the same render cycle to avoid `form.values`
     * containing stale values (ie: see `Alias.new`) */
    onHydrated?: (hydration: MaybeNull<ItemDraft<V>['formData']>) => void;
};

export const useItemDraft = <V extends {}>() => {
    const location = useLocation<ItemDraftState<V>>();
    return location.state?.draft;
};

/* Everytime the passed values change, this hook triggers
 * a debounced  dispatch with the form data. The `itemDraft`
 * action is cache blocking to avoid swarming the service
 * worker with encryption requests. The draft data should
 * only be encrypted & cached when the pop-up is closed.*/
export const useDraftSync = <V extends {}>(form: FormikContextType<V>, options: UseItemDraftOptions<V>) => {
    const [ready, setReady] = useState<boolean>(false);

    const draft = useItemDraft<V>();
    const { values, dirty } = form;

    const dispatch = useDispatch();

    const saveDraft = useCallback(
        debounce(
            (formData: V) =>
                dispatch(
                    itemDraftSave({
                        ...omit(options, ['onHydrated', 'sanitizeHydration', 'sanitizeSave']),
                        formData: options.sanitizeSave?.(formData) ?? formData,
                    })
                ),
            SAVE_DRAFT_TIMEOUT
        ),
        []
    );

    useEffect(() => {
        if (ready) {
            if (dirty) saveDraft(values);
            else {
                saveDraft.cancel();
                dispatch(itemDraftDiscard());
            }
        }
        return () => saveDraft.cancel();
    }, [ready, values, dirty]);

    useEffect(() => {
        void (async () => {
            if (draft) {
                const formValues = options.sanitizeHydration?.(draft.formData) ?? draft.formData;

                await form.setTouched(
                    Object.keys(formValues).reduce<FormikTouched<any>>((touched, field) => {
                        touched[field] = true;
                        return touched;
                    }, {}),
                    false
                );

                await form.setValues(formValues, true);

                form.setErrors(await form.validateForm(draft.formData));
                options.onHydrated?.(formValues);
            } else options.onHydrated?.(null);

            setReady(true);
        })();

        return () => {
            /* discard the draft if the component is unmounted :
             * this either means the item was successfully saved or
             * that the edit/creation discarded */
            dispatch(itemDraftDiscard());
        };
    }, []);

    return draft;
};
