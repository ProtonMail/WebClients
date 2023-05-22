import { type FC, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';
import type { Runtime } from 'webextension-polyfill';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { WorkerMessageWithSender } from '@proton/pass/types/worker';
import { WorkerMessageType } from '@proton/pass/types/worker';

/* we need to pass the runtime port object to this component
 * as it may be loaded inside a Portal outside of the extension
 * context provider's children  */
export const ImportProgress: FC<{ total: number; port?: Runtime.Port }> = ({ total, port }) => {
    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        const handleImportProgress = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.IMPORT_PROGRESS) {
                setProgress(message.payload.progress);
            }
        };

        port?.onMessage.addListener(handleImportProgress);
        return () => port?.onMessage.removeListener(handleImportProgress);
    }, [port]);

    return (
        <>
            {c('Info').t`Import in progress :`}{' '}
            <strong className="mx-2">
                {progress}/{total} {c('Info').ngettext(msgid`item`, `items`, total)}
            </strong>
            <CircleLoader />
        </>
    );
};
