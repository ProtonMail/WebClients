import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface Props {
    modalProps: ModalStateProps;
}

const ComposerAssistantB2CUpsellModal = ({ modalProps }: Props) => {
    const [user, loadingUser] = useUser();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });
    const upsellConfig = useUpsellConfig({ upsellRef, plan: PLANS.DUO, cycle: CYCLE.YEARLY });

    if (loadingUser || plansMapLoading) {
        return <Loader />;
    }
    const duoPlan = plansMap[PLANS.DUO];
    const monthlyAmount = (duoPlan?.Pricing[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const price = (
        <Price currency={duoPlan.Currency} suffix={c('Suffix').t`/month`} key="monthlyAmount">
            {monthlyAmount}
        </Price>
    );

    const title = user.isFree ? c('Title').t`Craft better emails` : c('Title').t`Your free trial has ended`;

    return (
        <UpsellModal
            title={title}
            description={c('Description')
                .t`For unlimited access to the writing assistant and more, upgrade to ${BRAND_NAME} Duo.`}
            modalProps={{
                ...modalProps,
                onClose: () => {
                    modalProps.onClose();
                },
            }}
            headerType="composer-assistant"
            features={['proton-scribe', '2-users-support', '1-tb-secure-storage', 'all-proton-products']}
            size="small"
            submitText={c('Action').t`Get ${BRAND_NAME} Duo`}
            submitPosition="outside"
            hideFeaturesListBorder={true}
            footerText={c('Description').jt`Starting from ${price}`}
            iconSize={4}
            sourceEvent="BUTTON_SCRIBE"
            {...upsellConfig}
        />
    );
};

export default ComposerAssistantB2CUpsellModal;
