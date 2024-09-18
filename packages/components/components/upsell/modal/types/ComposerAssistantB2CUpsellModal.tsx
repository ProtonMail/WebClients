import { c } from 'ttag';

import { type ModalStateProps } from '@proton/components/components';
import Loader from '@proton/components/components/loader/Loader';
import Price from '@proton/components/components/price/Price';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { usePreferredPlansMap, useUser } from '@proton/components/hooks';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    CYCLE,
    MAIL_UPSELL_PATHS,
    PLANS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
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
    const upsellConfig = useUpsellConfig({ upsellRef, planIDs: { [PLANS.DUO]: 1 }, cycle: CYCLE.YEARLY });

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
            {...upsellConfig}
        />
    );
};

export default ComposerAssistantB2CUpsellModal;
