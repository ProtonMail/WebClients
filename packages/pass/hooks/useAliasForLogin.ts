import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType } from 'formik';

import { selectAliasByAliasEmail } from '@proton/pass/store/selectors';
import type { ItemRevision, LoginItemFormValues, Maybe } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import type { UseAliasOptionsResult } from './useAliasOptions';
import { useAliasOptions } from './useAliasOptions';

export type AliasForLoginProps = {
    setOpen: (opened: boolean) => void;
    aliasOptions: UseAliasOptionsResult;
    canCreate: boolean;
    open: boolean;
    relatedAlias: Maybe<ItemRevision<'alias'>>;
    usernameIsAlias: boolean;
    willCreate: boolean;
};

export const useAliasForLogin = <T extends LoginItemFormValues>(form: FormikContextType<T>): AliasForLoginProps => {
    const [aliasModalOpen, setAliasModalOpen] = useState(false);

    const { values } = form;
    const { withAlias, itemEmail, aliasPrefix } = values;

    const aliasOptions = useAliasOptions({ shareId: form.values.shareId, lazy: true });
    const relatedAlias = useSelector(selectAliasByAliasEmail(itemEmail));
    const willCreateAlias = !relatedAlias && withAlias && !isEmptyString(aliasPrefix);

    useEffect(() => {
        if (relatedAlias) {
            void form.setValues((values) =>
                merge(values, {
                    withAlias: false,
                    aliasPrefix: '',
                    aliasSuffix: undefined,
                    mailboxes: [],
                })
            );
        }
    }, [relatedAlias]);

    useEffect(() => {
        if (aliasModalOpen) aliasOptions.request();
    }, [aliasModalOpen]);

    return useMemo(
        () => ({
            setOpen: setAliasModalOpen,
            aliasOptions,
            canCreate: !relatedAlias && !withAlias,
            open: aliasModalOpen,
            relatedAlias,
            usernameIsAlias: Boolean(relatedAlias || willCreateAlias),
            willCreate: willCreateAlias,
        }),
        [aliasOptions, withAlias, aliasModalOpen, relatedAlias, willCreateAlias]
    );
};
