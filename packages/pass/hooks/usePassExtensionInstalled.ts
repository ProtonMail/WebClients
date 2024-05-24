import { useEffect, useState } from 'react';

import { WorkerMessageType } from '@proton/pass/types';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const usePassExtensionInstalled = (supported: boolean): boolean => {
    const [installed, setInstalled] = useState(true);

    useEffect(() => {
        if (supported) {
            sendExtensionMessage(
                { type: WorkerMessageType.ACCOUNT_PROBE },
                { app: APPS.PROTONPASSBROWSEREXTENSION, maxTimeout: 1_000 }
            )
                .then((result) => setInstalled(result?.type === 'success'))
                .catch(noop);
        }
    }, []);

    return installed;
};
