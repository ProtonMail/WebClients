import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl, getProductForSupport } from '@proton/shared/lib/helpers/url';

import './SelfHelpModal.scss';

interface Props {
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
    onBugReportClick: () => void;
    app: APP_NAMES;
}

interface KnowledgeBaseMessage {
    type:
    | 'CONTACT_SUPPORT_REQUESTED'
    | 'CONTENT_HEIGHT_CHANGED'
    | 'TROUBLESHOOTING_CLOSE'
    | 'TROUBLESHOOTING_LOADED'
    | 'IFRAME_READY_FOR_STYLES';
    height?: number;
}

// Extract CSS variables from computed styles
const extractCssVariable = (variableName: string) => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return computedStyle.getPropertyValue(variableName).trim() || 'initial';
};

const cssOverrides = `
        ${(() => {
        const linkNorm = extractCssVariable('--optional-link-norm');
        const linkActive = extractCssVariable('--optional-link-active');
        return linkNorm !== 'initial'
            ? `
                main a { color: ${linkNorm} !important; }
                main a:hover { color: ${linkActive} !important; }
                main a:focus { color: ${linkActive} !important; }
            `
            : '';
    })()}
        #plans, #header { display: none !important;}
        #answer { padding-top: 0 !important;}
        .shadow-s { box-shadow: none !important; }
        .focus-within\\:ring-purple-200:focus-within { --tw-ring-color: ${extractCssVariable('--border-weak')} !important; }
        .md\\:flex-row { flex-direction: row !important; }
        [class*="hover\\:bg-purple-"]:hover { background-color: transparent !important; }
        .p-8 { padding-left: 0 !important; padding-right: 0 !important; }
        .px-2 { padding-left: 0 !important; padding-right: 0 !important; }
        .px-4 { padding-left: 0 !important; padding-right: 0 !important; }
        .border-purple-800 { border-color: ${extractCssVariable('--border-norm')} !important; }
        .text-purple-800 { color: ${extractCssVariable('--text-norm')} !important; }
        .text-body { color: ${extractCssVariable('--text-weak')} !important; }
        [class*="bg-purple-"] { background-color: transparent !important; }
        .bg-white { background-color: transparent !important; }
        .bg-transparent { background-color: transparent !important; }
        .bg-gray-100 { background-color: transparent !important; }
        .button-text-shadow { text-shadow: none !important; }
        button.bg-purple-500 { background-color: ${extractCssVariable('--interaction-norm')} !important; color: ${extractCssVariable('--interaction-norm-contrast')} !important; }
        button.bg-purple-500:hover { background-color: ${extractCssVariable('--interaction-norm-major-1')} !important; }
        button.bg-purple-500:active { background-color: ${extractCssVariable('--interaction-norm-major-2')} !important; }
        body { color: ${extractCssVariable('--text-norm')} !important; }
    `.trim();

const SelfHelpModal = ({ open, onClose, onExit, onBugReportClick, app }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [containerHeight, setContainerHeight] = useState(344);

    const product = getProductForSupport(app);

    useEffect(() => {
        const handleMessage = (event: MessageEvent<KnowledgeBaseMessage>) => {
            if (event.data?.type === 'CONTACT_SUPPORT_REQUESTED') {
                onBugReportClick();
                onClose?.();
            }
            if (event.data?.type === 'CONTENT_HEIGHT_CHANGED' && event.data.height) {
                setContainerHeight(event.data.height + 40);
            }
            if (event.data?.type === 'TROUBLESHOOTING_CLOSE') {
                onClose?.();
            }
            if (event.data?.type === 'TROUBLESHOOTING_LOADED') {
                // Remove the loader
                setIsLoading(false);
            }
            if (event.data?.type === 'IFRAME_READY_FOR_STYLES') {
                // Send the styles
                const iframe = document.querySelector('.help-center-iframe') as HTMLIFrameElement;
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(
                        {
                            type: 'THEME_STYLES',
                            styles: cssOverrides,
                        },
                        '*'
                    );
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onBugReportClick, onClose, cssOverrides]);

    const themeParams = new URLSearchParams({
        product,
    }).toString();

    const iframeSrc = `${getKnowledgeBaseUrl('/embedded-troubleshooting')}?${themeParams}`;

    return (
        <Modal open={open} onClose={onClose} onExit={onExit} size="large">
            <ModalHeader title={c('Title').t`Help center`} />
            <ModalContent className="help-center-container" style={{ blockSize: `${containerHeight}px` }}>
                <iframe
                    src={iframeSrc}
                    hidden={isLoading}
                    onLoad={() => setTimeout(() => setIsLoading(false), 2000)}
                    onError={() => {
                        onBugReportClick?.();
                        onClose?.();
                    }}
                    className="help-center-iframe"
                    title="Help center"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    referrerPolicy="no-referrer"
                />
                {isLoading && (
                    <div className="loader">
                        <CircleLoader size="medium" />
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
};

export default SelfHelpModal;
