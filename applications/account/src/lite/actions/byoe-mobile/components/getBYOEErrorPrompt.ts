import { c } from 'ttag';

import type { ConnectBYOEAddressFailure } from '@proton/activation/src/byoe/connectBYOEAddress.interface';
import { BRAND_NAME } from '@proton/shared/lib/constants';

/** Opens a knowledge base article. Only the path is stored, the URL is resolved when the link is opened. */
interface KBLink {
    type: 'kb-link';
    path: string;
}

/** Actions handled by the screen. */
export type ErrorPromptAction = { type: 'retry' } | { type: 'close' } | { type: 'claim' };

/** What a button does: either an action handled by the screen, or a link rendered by the prompt itself. */
export type ErrorPromptButtonAction = ErrorPromptAction | KBLink;

export interface ErrorPromptConfig {
    title: string;
    body: string;
    primary: { label: string; action: ErrorPromptButtonAction };
    secondary?: { label: string; action: ErrorPromptButtonAction };
    /** Link rendered under the body, for extra reading that must not replace a button. */
    kbLink?: { label: string; path: string };
}

const GENERIC_FAILURES = new Set<ConnectBYOEAddressFailure['type']>([
    'no-access',
    'create-failed',
    'convert-failed',
    'unknown',
]);

const GMAIL_CONNECTION_GUIDE: KBLink = {
    type: 'kb-link',
    path: '/troubleshooting-easy-switch#gmail-connection-setup',
};

/** Returns the content of the prompt to show for a failure, or null when nothing should be shown. */
export const getBYOEErrorPrompt = (
    reason: ConnectBYOEAddressFailure,
    emailAddress?: string
): ErrorPromptConfig | null => {
    if (GENERIC_FAILURES.has(reason.type)) {
        return {
            title: c('Title').t`Something went wrong`,
            body: c('Info').t`We couldn't connect your Gmail right now. Please try again in a few minutes.`,
            primary: { label: c('Action').t`Try again`, action: { type: 'retry' } },
            secondary: { label: c('Action').t`Cancel`, action: { type: 'close' } },
        };
    }

    if (reason.type === 'already-added') {
        return {
            title: c('Title').t`This Gmail is already connected`,
            body: c('Info')
                .t`This Gmail is already connected to your ${BRAND_NAME} account. There's nothing else you need to do.`,
            primary: { label: c('Action').t`Done`, action: { type: 'close' } },
        };
    }

    if (reason.type === 'wrong-account') {
        const body = emailAddress
            ? c('Info').t`Please sign in with ${emailAddress} to continue.`
            : c('Info').t`Please sign in with the Gmail account you want to connect to continue.`;

        return {
            title: c('Title').t`Wrong Gmail account`,
            body,
            primary: { label: c('Action').t`Try again`, action: { type: 'retry' } },
            secondary: { label: c('Action').t`Cancel`, action: { type: 'close' } },
        };
    }

    if (reason.type === 'linked-to-another-account') {
        const body = emailAddress
            ? c('Info')
                  .t`${emailAddress} is used to sign in to another ${BRAND_NAME} account. We are making the connection seamless, but for now you will need to take a few steps.`
            : c('Info')
                  .t`This Gmail is used to sign in to another ${BRAND_NAME} account. We are making the connection seamless, but for now you will need to take a few steps.`;

        return {
            title: c('Title').t`This Gmail is linked to another ${BRAND_NAME} account`,
            body,
            primary: { label: c('Action').t`View guide`, action: GMAIL_CONNECTION_GUIDE },
            secondary: { label: c('Action').t`Cancel`, action: { type: 'close' } },
        };
    }

    if (reason.type === 'token-failed') {
        const body = emailAddress
            ? c('Info')
                  .t`We couldn't connect ${emailAddress}. Try again and select all the boxes when Google asks for access. ${BRAND_NAME} only uses this access to connect your Gmail.`
            : c('Info')
                  .t`We couldn't connect your Gmail. Try again and select all the boxes when Google asks for access. ${BRAND_NAME} only uses this access to connect your Gmail.`;

        return {
            title: c('Title').t`Allow access to connect your Gmail`,
            body,
            primary: { label: c('Action').t`Try again`, action: { type: 'retry' } },
            secondary: { label: c('Action').t`Cancel`, action: { type: 'close' } },
        };
    }

    // Confirmation rather than an error: the user must decide before the connection continues
    if (reason.type === 'claimable-address') {
        return {
            title: c('Title').t`Good to know before you connect`,
            body: c('Info')
                .t`${reason.email} is used to sign in to another ${BRAND_NAME} account. You'll pick a new username for that account next time you sign in. Nothing else changes.`,
            primary: { label: c('Action').t`Connect Gmail`, action: { type: 'claim' } },
            secondary: { label: c('Action').t`Cancel`, action: { type: 'close' } },
            kbLink: { label: c('Link').t`Learn more`, path: GMAIL_CONNECTION_GUIDE.path },
        };
    }

    return null;
};
