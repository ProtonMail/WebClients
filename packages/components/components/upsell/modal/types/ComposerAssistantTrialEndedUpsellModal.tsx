import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Loader, ModalStateProps, Price, UpsellModal } from '@proton/components/components';
import { useSubscriptionModal } from '@proton/components/containers';
import {
    useAssistantUpsellConfig,
    useMember,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
} from '@proton/components/hooks';
import { getScribeAddonNameByPlan } from '@proton/components/payments/core';
import {
    ADDON_NAMES,
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_TYPES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

import { getAIAddonMonthlyPrice } from './ComposerAssistantTrialEndedupsellModel.helpers';

interface Props {
    modalProps: ModalStateProps;
    handleCloseAssistant: () => void;
}
const ComposerAssistantTrialEndedUpsellModal = ({ modalProps, handleCloseAssistant }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const [organization, loadingOrg] = useOrganization();
    const [member, loadingMember] = useMember();
    const isOrgUser = isOrganization(organization) && !isSuperAdmin(member ? [member] : []);

    const [user, loadingUser] = useUser();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });
    const { assistantUpsellConfig } = useAssistantUpsellConfig({ upsellRef, plans: plans?.plans ?? [] });

    if (loadingPlans || loadingUser || loadingOrg || loadingMember || loadingSubscription) {
        return <Loader />;
    }

    const addonPlanName = subscription?.Plans.reduce<ADDON_NAMES | undefined>((acc, { Name, Type }) => {
        const isPlan = (Type: PLAN_TYPES, name: typeof Name): name is PLANS => Type === PLAN_TYPES.PLAN;

        if (isPlan(Type, Name)) {
            acc = getScribeAddonNameByPlan(Name);
        }
        return acc;
    }, undefined);
    const monthlyPrice = plans?.plans && addonPlanName ? getAIAddonMonthlyPrice(plans.plans, addonPlanName) : undefined;
    const addonPriceWithCurrency = monthlyPrice ? <Price currency={user.Currency}>{monthlyPrice}</Price> : null;
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
                    handleCloseAssistant();
                    modalProps.onClose();
                },
            }}
            headerType="composer-assistant"
            featuresDescription={<b className="pb-4">{c('Description').t`Use the writing assistant to:`}</b>}
            features={['generate-emails-with-prompt', 'proofread-an-refine', 'save-time-emailing']}
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
                            handleCloseAssistant();
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
        />
    );
};

export default ComposerAssistantTrialEndedUpsellModal;
