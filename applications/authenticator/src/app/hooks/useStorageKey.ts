import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { Maybe } from '@proton/pass/types';

import { StorageKey } from '../../lib/db/db';
import type { StorageKeySource } from '../../lib/storage-key/types';

export const useStorageKeySource = () => {
    const { createNotification } = useNotifications();
    const [source, setSource] = useState<Maybe<StorageKeySource>>(() => StorageKey.source);

    useEffect(
        () =>
            StorageKey.listen((evt) => {
                switch (evt.type) {
                    case 'storage_key':
                        return setSource(evt.source);
                }
            }),
        []
    );

    const generate = useCallback(
        (source: StorageKeySource) =>
            StorageKey.generate({
                source,
                /** Disable any retry/cancel mechanism */
                confirm: () => {
                    createNotification({
                        type: 'error',
                        text: c('authenticator-2025:Error')
                            .t`Cannot generate secure storage key. You can try to create a password app lock instead`,
                    });

                    throw new Error('Failed upgrading');
                },
            }),
        []
    );

    return useMemo(() => ({ source, generate }), [source]);
};
