import {
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_BANNER_LINK_ID_REF_PATH,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import type { OpenCallbackProps } from '../SubscriptionModalProvider';
import { usePostSubscriptionModal } from './PostSubscriptionModalProvider';
import type { PostSubscriptionModalName } from './interface';

interface Props {
    upsellRef?: string;
}

// Better to get upsell ref as key to avoid duplicate cases
const UPSELL_REF_TO_MODAL: Record<string, PostSubscriptionModalName> = {
    // Settings Mail Short Domain upsell CTA
    [getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.SHORT_ADDRESS,
        isSettings: true,
    })]: 'mail-short-domain',
    // Mail Short Domain upsell Banner CTA
    [getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_BANNER_LINK_ID_REF_PATH.SEND_FROM_PM_ADDRESS,
        isSettings: false,
    })]: 'mail-short-domain',
    [getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.TIP,
        feature: MAIL_UPSELL_PATHS.SHORT_ADDRESS,
        isSettings: false,
    })]: 'mail-short-domain',
};

export const usePostSubscription = ({
    upsellRef,
}: Props): Pick<OpenCallbackProps, 'disableThanksStep' | 'onSubscribed'> | undefined => {
    const { openPostSubscriptionModal } = usePostSubscriptionModal();
    const modalName = upsellRef ? UPSELL_REF_TO_MODAL[upsellRef] : undefined;

    if (!modalName) {
        return;
    }

    const upsellModalProps: Exclude<ReturnType<typeof usePostSubscription>, undefined> = {
        /** Disable the thanks step */
        disableThanksStep: true,
        onSubscribed: () => {
            openPostSubscriptionModal(modalName);
        },
    };

    return upsellModalProps;
};
