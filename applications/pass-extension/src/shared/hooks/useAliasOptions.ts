import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { aliasOptionsRequested, selectAliasOptions, selectRequest } from '@proton/pass/store';
import * as requests from '@proton/pass/store/actions/requests';
import { ALIAS_OPTIONS_VALIDITY_WINDOW } from '@proton/pass/store/sagas/alias-options-request.saga';
import type { AliasMailbox } from '@proton/pass/types/data/alias';
import { getEpoch } from '@proton/pass/utils/time';

export type SanitizedAliasOptions = {
    suffixes: { value: string; signature: string }[];
    mailboxes: AliasMailbox[];
};

export type UseAliasOptionsConfig = {
    shareId: string;
    lazy?: boolean /* defer the alias options dispatch */;
    onAliasOptionsLoaded?: (aliasOptions: SanitizedAliasOptions) => any;
};

export type UseAliasOptionsResult = {
    aliasOptionsLoading: boolean;
    aliasOptions: SanitizedAliasOptions | null;
    requestAliasOptions: () => void;
};

export const useAliasOptions: (options: UseAliasOptionsConfig) => UseAliasOptionsResult = ({
    lazy = false,
    shareId,
    onAliasOptionsLoaded,
}) => {
    const dispatch = useDispatch();
    const aliasOptions = useSelector(selectAliasOptions);
    const aliasOptionsRequest = useSelector(selectRequest(requests.aliasOptions()));
    const aliasOptionsLoading = aliasOptionsRequest === undefined || aliasOptionsRequest?.status === 'start';

    const valid = useMemo(
        () =>
            aliasOptionsRequest !== undefined &&
            aliasOptionsRequest.status === 'success' &&
            getEpoch() - aliasOptionsRequest.requestedAt < ALIAS_OPTIONS_VALIDITY_WINDOW,
        [aliasOptions]
    );

    const requestAliasOptions = useCallback(
        () => !valid && dispatch(aliasOptionsRequested({ shareId })),
        [shareId, valid]
    );

    useEffect(() => {
        if (!lazy) requestAliasOptions();
    }, [lazy]);

    const sanitizedAliasOptions = useMemo(
        () =>
            aliasOptions !== null && valid
                ? {
                      suffixes: aliasOptions.suffixes.map(({ suffix, signedSuffix }) => ({
                          value: suffix,
                          signature: signedSuffix,
                      })),
                      mailboxes: aliasOptions.mailboxes,
                  }
                : null,
        [aliasOptions, valid]
    );

    useEffect(() => {
        if (!aliasOptionsLoading && sanitizedAliasOptions !== null) {
            onAliasOptionsLoaded?.(sanitizedAliasOptions);
        }
    }, [aliasOptionsLoading]);

    return { aliasOptions: sanitizedAliasOptions, aliasOptionsLoading, requestAliasOptions };
};
