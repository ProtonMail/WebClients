import { useEffect } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useEarlyAccess from '@proton/components/hooks/useEarlyAccess';
import useLocalState from '@proton/components/hooks/useLocalState';
import { PROTON_LOCAL_DOMAIN } from '@proton/shared/lib/localDev';
import { useFlag } from '@proton/unleash/useFlag';

import { MailDebugModal } from 'proton-mail/components/debug/MailDebugModal';

export const MailDebugButton = () => {
    const isDebugModeEnabled = useFlag('MailStoreDebugMode');
    const { currentEnvironment } = useEarlyAccess();

    const [debugModalProps, setDebugModalOpen, renderDebugModal] = useModalState();
    const [showDebugButton, setShowDebugButton] = useLocalState(false, 'proton-mail-debug');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+Shift+x toggles the debug button
            if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'x') {
                event.preventDefault();
                setShowDebugButton((prev) => !prev);
            }
        };

        const forceDebugMode =
            currentEnvironment === 'alpha' ||
            location.host.includes(PROTON_LOCAL_DOMAIN) ||
            location.host.startsWith('localhost:');

        if (forceDebugMode) {
            setShowDebugButton(true);
        } else {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [setShowDebugButton, currentEnvironment]);

    if (!isDebugModeEnabled || !showDebugButton) {
        return null;
    }

    return (
        <>
            <div className="border-top pt-2 text-center w-full">
                <button
                    type="button"
                    onClick={() => setDebugModalOpen(true)}
                    className="text-no-decoration color-weak text-sm m-0"
                >
                    {c('Action').t`Open debug menu`}
                </button>
            </div>
            {renderDebugModal && <MailDebugModal {...debugModalProps} />}
        </>
    );
};
