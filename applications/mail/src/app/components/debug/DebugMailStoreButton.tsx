import { useEffect, useState } from 'react';

import { useModalState } from '@proton/components/index';
import { useFlag } from '@proton/unleash/useFlag';

import { DebugMailStoreContextTotal } from 'proton-mail/components/debug/DebugMailStoreModal';
import { contextTotal } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

interface Props {
    showContextTotal?: boolean;
}

const DebugMailStoreButton = ({ showContextTotal = true }: Props) => {
    const isDebugModeEnabled = useFlag('MailStoreDebugMode');
    const count = useMailSelector(contextTotal);

    const [debugModalProps, setDebugModalOpen, renderDebugModal] = useModalState();
    const [showDebugButton, setShowDebugButton] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+Shift toggles the debug button
            if (event.ctrlKey && event.shiftKey) {
                event.preventDefault();
                setShowDebugButton((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!isDebugModeEnabled || !showDebugButton) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setDebugModalOpen(true)}
                className="text-no-decoration color-weak text-sm m-0 mb-1"
            >
                {showContextTotal ? <>contextTotal: {count ?? '–'}</> : <>Show debug modal</>}
            </button>
            {renderDebugModal && <DebugMailStoreContextTotal {...debugModalProps} />}
        </>
    );
};

export default DebugMailStoreButton;
