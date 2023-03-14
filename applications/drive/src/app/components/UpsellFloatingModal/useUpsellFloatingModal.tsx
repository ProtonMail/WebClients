import { useEffect } from 'react';

import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useActiveBreakpoint } from '@proton/components/hooks';

import { useDownload } from '../../store';
import UpsellFloatingModal from './UpsellFloatingModal';
import { UPSELL_MODAL_TIMEOUT } from './constants';

interface ModalProps {
    onlyOnce?: true;
}
const useUpsellFloatingModal = (): ReturnType<typeof useModalTwo<ModalProps, unknown>> => {
    const [renderUpsellFloatingModal, showUpsellFloatingModal] = useModalTwo<ModalProps, unknown>(UpsellFloatingModal);
    const { isNarrow } = useActiveBreakpoint();
    const { hasDownloads } = useDownload();

    useEffect(() => {
        if (hasDownloads) {
            void showUpsellFloatingModal({ onlyOnce: true });
        }
    }, [hasDownloads]);

    useEffect(() => {
        if (isNarrow) {
            return;
        }
        const timeout = setTimeout(() => {
            void showUpsellFloatingModal({});
        }, UPSELL_MODAL_TIMEOUT);

        return () => {
            clearTimeout(timeout);
        };
    }, [isNarrow]);

    return [renderUpsellFloatingModal, showUpsellFloatingModal];
};

export default useUpsellFloatingModal;
