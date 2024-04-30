import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getAliasOptionsIntent } from '@proton/pass/store/actions';
import { aliasOptionsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasOptions } from '@proton/pass/store/selectors';
import type { MaybeNull, MaybePromise } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';
import noop from '@proton/utils/noop';

import { useActionRequest } from './useActionRequest';

export type SanitizedAliasOptions = {
    suffixes: { value: string; signature: string }[];
    mailboxes: AliasMailbox[];
};

export type UseAliasOptionsParams = {
    lazy?: boolean /* defer the alias options dispatch */;
    shareId: string;
    onAliasOptionsLoaded?: (aliasOptions: SanitizedAliasOptions) => MaybePromise<void>;
};

export type UseAliasOptionsResult = {
    loading: boolean;
    request: () => void;
    value: MaybeNull<SanitizedAliasOptions>;
};

export const useAliasOptions = ({
    shareId,
    lazy = false,
    onAliasOptionsLoaded,
}: UseAliasOptionsParams): UseAliasOptionsResult => {
    const aliasOptions = useSelector(selectAliasOptions);

    const sanitizedAliasOptions = useMemo(
        () =>
            aliasOptions !== null
                ? {
                      suffixes: aliasOptions.suffixes.map(({ suffix, signedSuffix }) => ({
                          value: suffix,
                          signature: signedSuffix,
                      })),
                      mailboxes: aliasOptions.mailboxes,
                  }
                : null,
        [aliasOptions]
    );

    const getAliasOptions = useActionRequest(getAliasOptionsIntent, {
        initialRequestId: aliasOptionsRequest(shareId),
        onSuccess: sanitizedAliasOptions ? () => onAliasOptionsLoaded?.(sanitizedAliasOptions) : noop,
    });

    useEffect(() => {
        if (!lazy) getAliasOptions.dispatch({ shareId });
    }, [lazy]);

    return useMemo(
        () => ({
            loading: getAliasOptions.loading,
            request: () => getAliasOptions.dispatch({ shareId }),
            value: sanitizedAliasOptions,
        }),
        [sanitizedAliasOptions, getAliasOptions.loading, shareId]
    );
};
