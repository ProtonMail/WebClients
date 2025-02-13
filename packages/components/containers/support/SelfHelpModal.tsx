import { useEffect } from 'react';

import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl, getProductForSupport } from '@proton/shared/lib/helpers/url';

interface Props {
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
    onBugReportClick: () => void;
    app: APP_NAMES;
}

interface KnowledgeBaseMessage {
    type: 'CONTACT_SUPPORT_REQUESTED';
}

const SelfHelpModal = ({ open, onClose, onExit, onBugReportClick, app }: Props) => {
    useEffect(() => {
        const handleMessage = (event: MessageEvent<KnowledgeBaseMessage>) => {
            if (event.data?.type === 'CONTACT_SUPPORT_REQUESTED') {
                onBugReportClick();
                onClose?.();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onBugReportClick, onClose]);

    const product = getProductForSupport(app);
    const iframeSrc = `${getKnowledgeBaseUrl('/embedded-troubleshooting')}?product=${product}`;

    return (
        <Modal open={open} onClose={onClose} onExit={onExit} size="large">
            <ModalHeader title={c('Title').t`Help center`} />
            <ModalContent>
                <iframe
                    src={iframeSrc}
                    style={{
                        border: 'none',
                        width: '100%',
                        height: 'calc(90vh - 8rem)',
                        minHeight: '400px',
                        maxHeight: '100%',
                    }}
                    title="Help center"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    referrerPolicy="no-referrer"
                />
            </ModalContent>
        </Modal>
    );
};

export default SelfHelpModal;
