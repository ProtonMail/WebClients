import { useEffect, useState } from 'react';

import { type AccountProbeMessage, WorkerMessageType } from '@proton/pass/types';
import { getExtension } from '@proton/shared/lib/apps/helper';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const usePassExtensionInstalled = (supported: boolean): boolean => {
    const [installed, setInstalled] = useState(true);

    useEffect(() => {
        if (supported) {
            const extension = getExtension(APPS.PROTONPASSBROWSEREXTENSION);

            if (extension) {
                sendExtensionMessage<AccountProbeMessage>(
                    { type: WorkerMessageType.ACCOUNT_PROBE },
                    { extensionId: extension.ID, maxTimeout: 1000 }
                )
                    .then((result) => setInstalled(result?.type === 'success'))
                    .catch(noop);
            }
        }
    }, []);

    return installed;
};
