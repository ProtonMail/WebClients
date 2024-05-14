import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType } from 'formik';

import { selectAliasByAliasEmail } from '@proton/pass/store/selectors';
import type { LoginItemFormValues } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import { useAliasOptions } from './useAliasOptions';

export const useAliasForLoginModal = <T extends LoginItemFormValues>(form: FormikContextType<T>) => {
    const [aliasModalOpen, setAliasModalOpen] = useState(false);

    const { values } = form;
    const { withAlias, itemEmail, aliasPrefix } = values;

    const aliasOptions = useAliasOptions({ shareId: form.values.shareId, lazy: true });

    const relatedAlias = useSelector(selectAliasByAliasEmail(itemEmail));
    const canCreateAlias = !relatedAlias && !withAlias;
    const willCreateAlias = !relatedAlias && withAlias && !isEmptyString(aliasPrefix);
    const usernameIsAlias = relatedAlias || willCreateAlias;

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

    return {
        setOpen: setAliasModalOpen,
        open: aliasModalOpen,
        relatedAlias,
        canCreate: canCreateAlias,
        willCreate: willCreateAlias,
        usernameIsAlias,
        aliasOptions: aliasOptions,
    };
};
