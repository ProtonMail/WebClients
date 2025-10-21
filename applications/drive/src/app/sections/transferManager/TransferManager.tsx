import { useState } from 'react';

import { c } from 'ttag';

import { TransferManagerHeader } from './transferManagerHeader/transferManagerHeader';
import { useTransferManagerState } from './useTransferManagerState';

export const TransferManager = () => {
    const { items } = useTransferManagerState();
    const [isMinimized, setMinimized] = useState(false);

    const toggleMinimize = () => {
        setMinimized((value) => !value);
    };

    const onClose = () => {
        // TBI
    };

    return (
        <section aria-label={c('Label').t`File transfer overview`}>
            <TransferManagerHeader toggleMinimize={toggleMinimize} isMinimized={isMinimized} onClose={onClose} />

            {!isMinimized && (
                <div>
                    {items.map((item) => (
                        <div>{item.name}</div>
                    ))}
                </div>
            )}
        </section>
    );
};
