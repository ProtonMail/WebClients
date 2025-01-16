import { useEffect, useMemo, useState } from 'react';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { requestAliasOptions } from '@proton/pass/store/actions';
import type { MaybeNull, MaybePromise } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';

import { useRequest } from './useRequest';

export type SanitizedAliasOptions = {
    suffixes: { value: string; signature: string }[];
    mailboxes: AliasMailbox[];
};

export type UseAliasOptionsParams = {
    /** Defers the alias options dispatch */
    lazy?: boolean;
    shareId: string;
    onAliasOptionsLoaded?: (aliasOptions: SanitizedAliasOptions) => MaybePromise<void>;
};

export type UseAliasOptionsResult = {
    loading: boolean;
    unverified: boolean;
    value: MaybeNull<SanitizedAliasOptions>;
    request: () => void;
};

export const useAliasOptions = ({
    shareId,
    lazy = false,
    onAliasOptionsLoaded,
}: UseAliasOptionsParams): UseAliasOptionsResult => {
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<SanitizedAliasOptions>>(null);
    const [unverified, setUnverified] = useState(false);

    const getAliasOptions = useRequest(requestAliasOptions, {
        onFailure: (err) => setUnverified(err.code === PassErrorCode.UNVERIFIED_USER),
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
            unverified,
            value: aliasOptions,
            request: () => getAliasOptions.dispatch(shareId),
        }),
        [aliasOptions, getAliasOptions.loading, unverified, shareId]
    );
};
