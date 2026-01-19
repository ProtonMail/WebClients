import { useEffect, useMemo, useState } from 'react';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { requestAliasOptions } from '@proton/pass/store/actions';
import type { MaybeNull, MaybePromise, Result } from '@proton/pass/types';
import type { AliasMailbox } from '@proton/pass/types/data/alias';

import { useRequest } from './useRequest';

export type SanitizedAliasOptions = {
    suffixes: { value: string; signature: string; isPremium: boolean; isCustom: boolean }[];
    mailboxes: AliasMailbox[];
};

export type UseAliasOptionsParams = {
    /** Defers the alias options dispatch */
    lazy?: boolean;
    shareId: string;
    onAliasOptions?: (result: Result<{ aliasOptions: SanitizedAliasOptions }>) => MaybePromise<void>;
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
    onAliasOptions,
}: UseAliasOptionsParams): UseAliasOptionsResult => {
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<SanitizedAliasOptions>>(null);
    const [unverified, setUnverified] = useState(false);

    const getAliasOptions = useRequest(requestAliasOptions, {
        onSuccess: (options) => {
            const sanitized = {
                suffixes: options.suffixes.map(({ suffix, signedSuffix, isPremium, isCustom }) => ({
                    value: suffix,
                    signature: signedSuffix,
                    isPremium,
                    isCustom,
                })),
                mailboxes: options.mailboxes,
            };

            setAliasOptions(sanitized);
            return onAliasOptions?.({ ok: true, aliasOptions: sanitized });
        },
        onFailure: (err) => {
            setUnverified(err.code === PassErrorCode.UNVERIFIED_USER);
            return onAliasOptions?.({ ok: false });
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
