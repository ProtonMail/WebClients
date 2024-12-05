import { useUser } from '@proton/account/user/hooks';
import {
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_BANNER_LINK_ID_REF_PATH,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import useFlag from '@proton/unleash/useFlag';

import type { OpenCallbackProps } from '../SubscriptionModalProvider';
import PostSubscriptionModal from './PostSubscriptionModal';
import type { PostSubscriptionFlowName } from './interface';

interface Props extends Pick<OpenCallbackProps, 'onSubscribed'> {
    upsellRef?: string;
}

// Better to get upsell ref as key to avoid duplicate cases
const UPSELL_REF_TO_POST_SUBCRIPTION_FLOW: Record<string, PostSubscriptionFlowName> = {
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
    onSubscribed,
}: Props): Pick<OpenCallbackProps, 'disableThanksStep' | 'onSubscribed' | 'renderCustomStepModal'> | undefined => {
    const isPostSubscriptionFlowEnabled = useFlag('InboxWebPostSubscriptionFlow');
    const flowName = upsellRef ? UPSELL_REF_TO_POST_SUBCRIPTION_FLOW[upsellRef] : undefined;
    const [user] = useUser();

    if (!flowName || !user.isFree || !isPostSubscriptionFlowEnabled) {
        return;
    }

    const upsellModalProps: Exclude<ReturnType<typeof usePostSubscription>, undefined> = {
        // Force thanks step
        disableThanksStep: false,
        renderCustomStepModal: (step, modalProps) => {
            if (flowName) {
                return (
                    <PostSubscriptionModal
                        {...modalProps}
                        onClose={() => {
                            modalProps.onClose?.();
                            onSubscribed?.();
                        }}
                        step={step}
                        name={flowName}
                    />
                );
            }
        },
    };

    return upsellModalProps;
};
