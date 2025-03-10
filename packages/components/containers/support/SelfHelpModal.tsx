import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import { APPS, type APP_NAMES, OPEN_COMPOSER_WITH_MAILTO_EVENT } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl, getProductForSupport, getStaticURL } from '@proton/shared/lib/helpers/url';

import { useHelpCenterIframeStyles } from './useIframeCssOverrides';

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
        | 'IFRAME_READY_FOR_STYLES'
        | 'OPEN_LINK'
        | 'OPEN_COMPOSER';
    height?: number;
    href?: string;
    mailto?: string;
}

const SelfHelpModal = ({ open, onClose, onExit, onBugReportClick, app }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [containerHeight, setContainerHeight] = useState(344);
    const cssOverrides = useHelpCenterIframeStyles();

    const product = getProductForSupport(app);

    useEffect(() => {
        /**
         * Handle messages from the iframe
         * Security considerations:
         * 1. We validate the origin of incoming messages to ensure they come from trusted sources
         * 2. We only send messages back to trusted origins
         *
         * Since we validate the origin of the messages, we can trust the content (including URLs)
         * sent from the iframe. The iframe is hosted on our domain and is under our control.
         */
        const handleMessage = (event: MessageEvent<KnowledgeBaseMessage>) => {
            // Validate the origin of the message
            // Trusted origins are proton.me and current domain
            const trustedOrigins = [
                getStaticURL(''), // KB URL without trailing slash
                window.location.origin, // Same origin
            ];

            if (!trustedOrigins.includes(event.origin)) {
                console.warn(`Message received from untrusted origin: ${event.origin}`);
                return;
            }

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
                            styles: encodeURIComponent(cssOverrides),
                        },
                        '*'
                    );
                }
            }
            if (event.data?.type === 'OPEN_LINK') {
                // Handle link clicks from the iframe
                if (event.data.href) {
                    const url = event.data.href;

                    // Since we've already validated the origin of the message,
                    // we can trust the URLs sent from the iframe

                    if (isElectronMail) {
                        // For Electron, use the openLinkInBrowser helper
                        openLinkInBrowser(url);
                    } else {
                        if (url.startsWith('mailto:')) {
                            // For web browser
                            // Use the custom event to open the composer with the mailto link
                            document.dispatchEvent(
                                new CustomEvent(OPEN_COMPOSER_WITH_MAILTO_EVENT, {
                                    detail: { mailto: url },
                                })
                            );
                            // if app is calendar, we can open in new tab
                            if (app !== APPS.PROTONMAIL) {
                                window.open(url, '_blank');
                            } else {
                                onClose?.();
                            }
                        } else {
                            if (url.startsWith('https://')) {
                                window.open(url, '_blank');
                            } else {
                                window.open(getStaticURL(url), '_blank');
                            }
                        }
                    }
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
