import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components/components';
import { Loader, Price } from '@proton/components/components';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useSubscriptionModal } from '@proton/components/containers';
import { useAssistantUpsellConfig, usePlans, usePreferredPlansMap, useSubscription } from '@proton/components/hooks';
import { getScribeAddonNameByPlan } from '@proton/components/payments/core';
import type { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, PLAN_TYPES, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { getAIAddonMonthlyPrice } from './ComposerAssistantUpsellModal.helpers';

interface Props {
    modalProps: ModalStateProps;
    isOrgUser?: boolean;
}
const ComposerAssistantB2BUpsellModal = ({ modalProps, isOrgUser }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();

    const [plans, loadingPlans] = usePlans();
    const { plansMap } = usePreferredPlansMap();
    const [subscription, loadingSubscription] = useSubscription();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });
    const { assistantUpsellConfig } = useAssistantUpsellConfig({ upsellRef, plans: plans?.plans ?? [] });

    if (loadingPlans || loadingSubscription) {
        return <Loader />;
    }

    const addonPlanName = subscription?.Plans?.reduce<ADDON_NAMES | undefined>((acc, { Name, Type }) => {
        const isPlan = (Type: PLAN_TYPES, name: typeof Name): name is PLANS => Type === PLAN_TYPES.PLAN;

        if (isPlan(Type, Name)) {
            acc = getScribeAddonNameByPlan(Name);
        }
        return acc;
    }, undefined);
    const monthlyPrice = plansMap && addonPlanName ? getAIAddonMonthlyPrice(plansMap, addonPlanName) : undefined;
    const addonPriceWithCurrency = monthlyPrice ? (
        <Price currency={monthlyPrice.Currency}>{monthlyPrice.Amount}</Price>
    ) : null;
    const title = c('Title').t`Your free trial has ended`;

    return (
        <UpsellModal
            title={title}
            description={
                isOrgUser
                    ? c('Description').t`To continue to use the writing assistant, request access from your admin.`
                    : c('Description').t`To continue to use the writing assistant, add it to your subscription.`
            }
            modalProps={{
                ...modalProps,
                onClose: () => {
                    modalProps.onClose();
                },
            }}
            headerType="composer-assistant"
            features={[
                'generate-emails-with-prompt',
                'quickly-craft-replies',
                'proofread-an-refine',
                'save-time-emailing',
            ]}
            size="small"
            submitText={c('Action').t`Get the writing assistant`}
            submitButton={
                isOrgUser ? (
                    <Button
                        size="large"
                        color="norm"
                        shape="solid"
                        fullWidth
                        onClick={() => {
                            modalProps.onClose();
                        }}
                    >
                        {c('Action').t`Close`}
                    </Button>
                ) : (
                    <Button
                        size="large"
                        color="norm"
                        shape="solid"
                        fullWidth
                        onClick={() => {
                            if (assistantUpsellConfig) {
                                openSubscriptionModal(assistantUpsellConfig);
                                modalProps.onClose();
                            }
                        }}
                    >
                        {addonPriceWithCurrency
                            ? c('Action').jt`Get it from only ${addonPriceWithCurrency} /month`
                            : c('Action').jt`Get it`}
                    </Button>
                )
            }
            submitPosition="outside"
            hideFeaturesListBorder={true}
            iconSize={4}
        />
    );
};

export default ComposerAssistantB2BUpsellModal;
