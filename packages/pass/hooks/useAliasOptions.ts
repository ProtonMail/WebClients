import { useEffect, useMemo, useState } from 'react';

import type { getAliasOptionsFailure, getAliasOptionsSuccess } from '@proton/pass/store/actions';
import { getAliasOptionsIntent } from '@proton/pass/store/actions';
import { aliasOptionsRequest } from '@proton/pass/store/actions/requests';
import type { MaybeNull, MaybePromise } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';

import { useActionRequest } from './useRequest';

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
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<SanitizedAliasOptions>>(null);

    const getAliasOptions = useActionRequest<
        typeof getAliasOptionsIntent,
        typeof getAliasOptionsSuccess,
        typeof getAliasOptionsFailure
    >(getAliasOptionsIntent, {
        requestId: aliasOptionsRequest(shareId),
        onSuccess: ({ options }) => {
            const sanitized = {
                suffixes: options.suffixes.map(({ suffix, signedSuffix }) => ({
                    value: suffix,
                    signature: signedSuffix,
                })),
                mailboxes: options.mailboxes,
            };

            setAliasOptions(sanitized);
            return onAliasOptionsLoaded?.(sanitized);
        },
    });

    useEffect(() => {
        if (!lazy) getAliasOptions.dispatch({ shareId });
    }, [lazy]);

    return useMemo(
        () => ({
            loading: getAliasOptions.loading,
            request: () => getAliasOptions.dispatch({ shareId }),
            value: aliasOptions,
        }),
        [aliasOptions, getAliasOptions.loading, shareId]
    );
};
