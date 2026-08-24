import { useEffect, useState } from 'react';

import type { PassInstalledMessage } from '@proton/shared/lib/browser/extension';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { MaybeNull } from '../types';

/** Cache the detection result to avoid redundant extension
 * communication if the hook is used multiple times. Assumes
 * the extension is installed by default. */
let extensionInstalled: MaybeNull<boolean> = null;

export const usePassExtensionInstalled = (supported: boolean): boolean => {
    const [installed, setInstalled] = useState(extensionInstalled ?? true);

    useEffect(() => {
        if (supported && extensionInstalled === null) {
            sendExtensionMessage({ type: 'pass-installed' } satisfies PassInstalledMessage, {
                app: APPS.PROTONPASSBROWSEREXTENSION,
                maxTimeout: 1_000,
            })
                .then((result) => {
                    extensionInstalled = result?.type === 'success';
                    setInstalled(extensionInstalled);
                })
                .catch(noop);
        }
    }, []);

    return installed;
};
