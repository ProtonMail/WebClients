import { useEffect, useMemo, useState } from 'react';

import { requestAliasOptions } from '@proton/pass/store/actions';
import type { MaybeNull, MaybePromise } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';

import { useRequest } from './useRequest';

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

    const getAliasOptions = useRequest(requestAliasOptions, {
        onSuccess: (options) => {
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
        if (!lazy) getAliasOptions.dispatch(shareId);
    }, [lazy]);

    return useMemo(
        () => ({
            loading: getAliasOptions.loading,
            request: () => getAliasOptions.dispatch(shareId),
            value: aliasOptions,
        }),
        [aliasOptions, getAliasOptions.loading, shareId]
    );
};
