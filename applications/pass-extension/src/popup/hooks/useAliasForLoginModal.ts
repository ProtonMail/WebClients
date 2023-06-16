import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType } from 'formik';

import { selectAliasByAliasEmail } from '@proton/pass/store';
import { merge } from '@proton/pass/utils/object';
import { isEmptyString } from '@proton/pass/utils/string';

import type { LoginItemFormValues } from '../../shared/form/types';
import { useAliasOptions } from '../../shared/hooks/useAliasOptions';

export const useAliasForLoginModal = <T extends LoginItemFormValues>(form: FormikContextType<T>) => {
    const [aliasModalOpen, setAliasModalOpen] = useState(false);

    const { values } = form;
    const { withAlias, username, aliasPrefix } = values;

    const { aliasOptions, aliasOptionsLoading } = useAliasOptions({ shareId: form.values.shareId });
    const relatedAlias = useSelector(selectAliasByAliasEmail(username));
    const canCreateAlias = !relatedAlias && !withAlias;
    const willCreateAlias = !relatedAlias && withAlias && !isEmptyString(aliasPrefix);
    const usernameIsAlias = relatedAlias || willCreateAlias;

    useEffect(() => {
        if (relatedAlias) {
            form.setValues((values) =>
                merge(values, {
                    withAlias: false,
                    aliasPrefix: '',
                    aliasSuffix: undefined,
                    mailboxes: [],
                })
            );
        }
    }, [relatedAlias]);

    return {
        setOpen: setAliasModalOpen,
        open: aliasModalOpen,
        relatedAlias,
        canCreate: canCreateAlias,
        willCreate: willCreateAlias,
        usernameIsAlias,
        aliasOptions,
        loading: aliasOptionsLoading,
    };
};
