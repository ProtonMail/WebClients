import { useEffect } from 'react';

import { useModalTwo } from '@proton/components';
import { useActiveBreakpoint } from '@proton/components/hooks';
import { IS_PROTON_USER_COOKIE_NAME } from '@proton/components/hooks/useIsProtonUserCookie';
import { getCookie } from '@proton/shared/lib/helpers/cookies';

import { useDownload } from '../../../store';
import UpsellFloatingModal from './UpsellFloatingModal';
import { UPSELL_MODAL_TIMEOUT } from './constants';

interface ModalProps {
    onlyOnce?: true;
}
const useUpsellFloatingModal = (): ReturnType<typeof useModalTwo<ModalProps, unknown>> => {
    const [renderUpsellFloatingModal, showUpsellFloatingModal] = useModalTwo<ModalProps | void, unknown>(
        UpsellFloatingModal,
        false
    );
    const { isNarrow } = useActiveBreakpoint();
    const { hasDownloads } = useDownload();
    // If user is proton user we disable upsell auto-show
    const isProtonUser = !!getCookie(IS_PROTON_USER_COOKIE_NAME);

    useEffect(() => {
        if (isProtonUser) {
            return;
        }
        if (hasDownloads) {
            void showUpsellFloatingModal({ onlyOnce: true });
        }
    }, [hasDownloads, isProtonUser]);

    useEffect(() => {
        if (isNarrow || isProtonUser) {
            return;
        }
        const timeout = setTimeout(() => {
            void showUpsellFloatingModal();
        }, UPSELL_MODAL_TIMEOUT);

        return () => {
            clearTimeout(timeout);
        };
    }, [isNarrow, isProtonUser]);

    return [renderUpsellFloatingModal, showUpsellFloatingModal];
};

export default useUpsellFloatingModal;
