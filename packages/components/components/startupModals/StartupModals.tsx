import { useEffect, useRef, useState } from 'react';

import { domIsBusy } from '@proton/shared/lib/busy';
import { SECOND } from '@proton/shared/lib/constants';

import type { StartupModal } from './types';

interface StartPayload {
    time: number;
}

const getStartModalExpired = (initial: StartPayload, now: StartPayload) => {
    return now.time - initial.time > 20 * SECOND;
};

const StartupModals = ({
    modals,
    setModalOpen = () => {},
}: {
    modals: StartupModal[];
    setModalOpen?: (state: boolean) => void;
}) => {
    // This ref ensures only one modal is shown at a time
    const onceRef = useRef(false);
    const [initial] = useState(() => {
        return { time: Date.now() };
    });

    const modalVisibilitySignature = modals.map((m) => m.showModal).join('');

    useEffect(() => {
        const modal = modals.find(({ showModal }) => showModal);
        const isExpired = () => getStartModalExpired(initial, { time: Date.now() });

        if (onceRef.current || !modal || isExpired()) {
            setModalOpen(false);
            return;
        }

        const activate = () => {
            onceRef.current = true;
            modal.activateModal();
            setModalOpen(true);
        };

        if (!domIsBusy()) {
            activate();
            return;
        }

        if (!modal.retryUntilIdle) {
            setModalOpen(false);
            return;
        }

        const intervalId = window.setInterval(() => {
            if (isExpired()) {
                window.clearInterval(intervalId);
                setModalOpen(false);
                return;
            }

            if (!domIsBusy()) {
                window.clearInterval(intervalId);
                activate();
            }
        }, SECOND);

        return () => window.clearInterval(intervalId);
    }, [modalVisibilitySignature]);

    const modal = modals.find(({ showModal }) => showModal);
    return modal?.component;
};

export default StartupModals;
