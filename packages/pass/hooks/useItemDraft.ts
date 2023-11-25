import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import type { FormikTouched } from 'formik';
import { type FormikContextType } from 'formik';

import { draftDiscard, draftSave } from '@proton/pass/store/actions';
import type { Draft, DraftBase } from '@proton/pass/store/reducers';
import { selectItemDrafts } from '@proton/pass/store/selectors';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import debounce from '@proton/utils/debounce';

import { itemEq } from '../lib/items/item.predicates';

const SAVE_DRAFT_TIMEOUT = 500;

export type LocationDraftState<V extends {} = {}> = Maybe<{ draft?: Draft<V> }>;

/** Parses the draft from the history location state */
export const useItemDraftLocationState = <V extends {}>() => {
    const location = useLocation<LocationDraftState<V>>();
    return location.state?.draft;
};

type UseItemDraftOptions<V extends {}> = DraftBase & {
    /** Apply sanitization over the draft values */
    sanitizeHydration?: (formData: Draft<V>['formData']) => Draft<V>['formData'];
    /** Callback called right before saving the draft to state if you
     * need to run some extra sanity checks */
    sanitizeSave?: (formData: Draft<V>['formData']) => Draft<V>['formData'];
    /** Retrieve the sanitized draft values after form hydration.
     * This may be useful when chaining multiple form `setValue`
     * calls inside the same render cycle to avoid `form.values`
     * containing stale values (ie: see `Alias.new`) */
    onHydrated?: (hydration: MaybeNull<Draft<V>['formData']>) => void;
};

/** Everytime the passed values change, this hook triggers a debounced
 * dispatch with the form data. The `itemDraft` action throttles caching
 * to avoid swarming the service worker with encryption requests */
export const useItemDraft = <V extends {}>(form: FormikContextType<V>, options: UseItemDraftOptions<V>) => {
    const draft = useItemDraftLocationState<V>();
    const drafts = useSelector(selectItemDrafts, () => true);

    const shouldInvalidate = useRef(
        (() => {
            const isEdit = draft === undefined && options.mode === 'edit';
            return isEdit && drafts.some((entry) => entry.mode === 'edit' && itemEq(options)(entry));
        })()
    );

    const { onHydrated, sanitizeHydration, sanitizeSave, ...baseDraft } = options;
    const { values, dirty } = form;
    const [ready, setReady] = useState<boolean>(false);

    const dispatch = useDispatch();

    const saveDraft = useCallback(
        debounce(
            (formData: V) => dispatch(draftSave({ ...baseDraft, formData: sanitizeSave?.(formData) ?? formData })),
            SAVE_DRAFT_TIMEOUT
        ),
        []
    );

    useEffect(() => {
        if (ready) {
            if (dirty) saveDraft(values);
            else {
                saveDraft.cancel();
                if (shouldInvalidate.current) {
                    dispatch(draftDiscard(baseDraft));
                    shouldInvalidate.current = false;
                }
            }
        }
        return () => saveDraft.cancel();
    }, [ready, values, dirty]);

    useEffect(() => {
        void (async () => {
            if (draft) {
                const formValues = sanitizeHydration?.(draft.formData) ?? draft.formData;

                await form.setTouched(
                    Object.keys(formValues).reduce<FormikTouched<any>>((touched, field) => {
                        touched[field] = true;
                        return touched;
                    }, {}),
                    false
                );

                await form.setValues(formValues, true);

                form.setErrors(await form.validateForm(draft.formData));
                onHydrated?.(formValues);
            } else onHydrated?.(null);

            setReady(true);
        })();

        return () => {
            /* discard the draft if the component is unmounted :
             * this either means the item was successfully saved or
             * that the edit/creation discarded */
            if (draft) dispatch(draftDiscard(baseDraft));
        };
    }, []);

    return draft;
};
