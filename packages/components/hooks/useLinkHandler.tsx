import type { ReactNode, RefObject } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { PROTON_DOMAINS } from '@proton/shared/lib/constants';
import { getSecondLevelDomain, isSubDomain } from '@proton/shared/lib/helpers/url';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { CONFIRM_LINK } from '@proton/shared/lib/mail/mailSettings';
import isTruthy from '@proton/utils/isTruthy';

import LinkConfirmationModal from '../components/notifications/LinkConfirmationModal/LinkConfirmationModal';
import { getHostname, isExternal, punycodeUrl } from '../helpers/url';
import useHandler from './useHandler';

// Reference : Angular/src/app/utils/directives/linkHandler.js

interface UseLinkHandlerOptions {
    onMailTo?: (src: string) => void;
    startListening?: boolean;
    isOutside?: boolean;
    isPhishingAttempt?: boolean;
}
type UseLinkHandler = (
    wrapperRef: RefObject<HTMLDivElement | undefined>,
    mailSettings?: MailSettings,
    options?: UseLinkHandlerOptions
) => { modal: ReactNode };

const defaultOptions: UseLinkHandlerOptions = {
    startListening: true,
};

const getSrc = (target: Element) => {
    return { encoded: target.toString() || '', raw: target.getAttribute('href') || '' };
};

export const useLinkHandler: UseLinkHandler = (
    wrapperRef,
    mailSettings,
    { onMailTo, startListening, isOutside, isPhishingAttempt } = defaultOptions
) => {
    const { createNotification } = useNotifications();
    const [link, setLink] = useState<string>();
    const [linkConfirmationModalProps, setLinkConfirmationModalOpen, renderLinkConfirmationModal] = useModalState();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const handleClick = useHandler(async (event: Event) => {
        const originalTarget = event.target as Element;
        const target = originalTarget.closest('a') || originalTarget.closest('area');

        if (!target) {
            return;
        }

        const src = getSrc(target);

        if (!src.raw) {
            createNotification({
                text: c('Error')
                    .t`This message may contain some links URL that cannot be properly opened by your current browser.`,
                type: 'error',
            });
        }

        // We only handle anchor that begins with `mailto:`
        if (src.raw.toLowerCase().startsWith('mailto:') && onMailTo) {
            event.preventDefault();
            event.stopPropagation(); // Required for Safari

            /*
             * Open the composer with the given mailto address
             * position isAfter true as the user can choose to set a body
             */
            onMailTo(src.raw);
        }

        const askForConfirmation = mailSettings?.ConfirmLink ?? CONFIRM_LINK.CONFIRM;
        const hostname = getHostname(src.raw);
        const currentDomain = getSecondLevelDomain(window.location.hostname);

        /*
         * If the modal is already active --- do nothing
         * ex: click on a link, open the modal, inside the continue button is an anchor with the same link.
         */
        if (linkConfirmationModalProps.open) {
            return;
        }

        /*
         * If dealing with anchors, we need to treat them separately because we use URLs with # for searching elements
         */
        if (src.raw.startsWith('#')) {
            const id = src.raw.replace('#', '');
            if (wrapperRef.current) {
                const elementInMail = wrapperRef.current.querySelector(`[name="${id}"], [id="${id}"]`);
                if (elementInMail) {
                    elementInMail.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        if (
            (askForConfirmation || isPhishingAttempt) &&
            isExternal(src.raw, window.location.hostname) &&
            ![...PROTON_DOMAINS, currentDomain]
                .filter(isTruthy) // currentDomain can be null
                .some((domain) => isSubDomain(hostname, domain))
        ) {
            event.preventDefault();
            event.stopPropagation(); // Required for Safari

            const link = punycodeUrl(src.encoded || src.raw);
            setLink(link);
            setLinkConfirmationModalOpen(true);
        }
    });

    useEffect(() => {
        if (startListening === false) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        wrapperRef.current?.addEventListener('click', handleClick, false);
        return () => {
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            wrapperRef.current?.removeEventListener('click', handleClick, false);
        };
    }, [startListening, wrapperRef.current]);

    const modal = renderLinkConfirmationModal ? (
        <LinkConfirmationModal
            link={link}
            isOutside={isOutside}
            isPhishingAttempt={isPhishingAttempt}
            {...linkConfirmationModalProps}
        />
    ) : null;

    return { modal };
};
