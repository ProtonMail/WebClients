import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import type { FormikTouched } from 'formik';
import { type FormikContextType } from 'formik';

import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { draftDiscard, draftSave } from '@proton/pass/store/actions';
import type { Draft, DraftBase } from '@proton/pass/store/reducers';
import { selectItemDrafts } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import debounce from '@proton/utils/debounce';

const SAVE_DRAFT_TIMEOUT = 500;
const DRAFT_HASH = '#draft';

export const useMatchDraftHash = (): boolean => {
    const { location } = useHistory();
    return useMemo(() => location.hash === DRAFT_HASH, []);
};

type UseItemDraftOptions<V extends {}> = DraftBase & {
    canSave?: boolean;
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
    const history = useHistory();
    const isDraft = useMatchDraftHash();
    const drafts = useSelector(selectItemDrafts, () => true);
    const draft = useMemo(() => (isDraft ? first(drafts) : undefined), []);

    const shouldInvalidate = useRef(
        (() => {
            const isEdit = draft === undefined && options.mode === 'edit';
            return isEdit && drafts.some((entry) => entry.mode === 'edit' && itemEq(options)(entry));
        })()
    );

    const { onHydrated, sanitizeHydration, sanitizeSave, ...draftOptions } = options;
    const { values, dirty } = form;
    const [ready, setReady] = useState<boolean>(false);

    const dispatch = useDispatch();

    const saveDraft = useCallback(
        debounce(
            (formData: V) => dispatch(draftSave({ ...draftOptions, formData: sanitizeSave?.(formData) ?? formData })),
            SAVE_DRAFT_TIMEOUT
        ),
        []
    );

    useEffect(() => {
        if (ready) {
            const { location } = history;
            const { hash } = location;

            if (dirty && (options.canSave ?? true)) {
                saveDraft(values);
                if (hash !== DRAFT_HASH) history.replace({ ...location, hash: 'draft' });
            } else {
                saveDraft.cancel();
                if (shouldInvalidate.current) {
                    dispatch(draftDiscard(draftOptions));
                    shouldInvalidate.current = false;
                    history.replace({ ...location, hash: '' });
                }
            }
        }

        return () => saveDraft.cancel();
    }, [ready, values, dirty, options.canSave]);

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
            dispatch(draftDiscard(draftOptions));
        };
    }, []);

    return draft;
};
