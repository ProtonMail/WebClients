import { useEffect } from 'react';

import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useActiveBreakpoint } from '@proton/components/hooks';

import UpsellFloatingModal from './UpsellFloatingModal';
import { UPSELL_MODAL_TIMEOUT } from './constants';

const useUpsellFloatingModal = (): ReturnType<typeof useModalTwo> => {
    const [renderUpsellFloatingModal, handleToggleModal] = useModalTwo(UpsellFloatingModal);
    const { isNarrow } = useActiveBreakpoint();

    useEffect(() => {
        if (isNarrow) {
            return;
        }
        const timeout = setTimeout(() => {
            void handleToggleModal({});
        }, UPSELL_MODAL_TIMEOUT);

        return () => {
            clearTimeout(timeout);
        };
    }, [isNarrow]);

    return [renderUpsellFloatingModal, handleToggleModal];
};

export default useUpsellFloatingModal;
