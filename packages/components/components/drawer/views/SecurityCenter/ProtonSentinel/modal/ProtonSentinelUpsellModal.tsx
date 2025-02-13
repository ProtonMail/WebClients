import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { CYCLE, type Currency, PLANS } from '@proton/payments';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    PROTON_SENTINEL_NAME,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import shieldImg from '@proton/styles/assets/img/illustrations/new-upsells-img/shield.svg';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const ProtonSentinelUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const [user] = useUser();

    const upsellConfig = useUpsellConfig({
        upsellRef: getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.PROTON_SENTINEL,
        }),
        plan: PLANS.BUNDLE,
    });

    const currency: Currency = user?.Currency || 'USD';
    const [plansResult] = usePlans();
    const mailUnlimited = plansResult?.plans?.find(({ Name }) => Name === PLANS.BUNDLE);

    const amount = (mailUnlimited?.DefaultPricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const priceUnlimited = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {amount}
        </Price>
    );

    return (
        <UpsellModal
            data-testid="security-center:proton-sentinel:upsell-modal"
            titleModal={c('Title').t`High security for your account`}
            description={c('Description')
                .t`${PROTON_SENTINEL_NAME} protects your account with dedicated 24/7 monitoring of suspicious activity — including escalation to security specialists.`}
            modalProps={modalProps}
            illustration={shieldImg}
            submitText={c('Action').t`Upgrade to ${BRAND_NAME} Unlimited`}
            footerText={c('Action').jt`Starting from ${priceUnlimited}`}
            sourceEvent="BUTTON_SENTINEL"
            {...upsellConfig}
        />
    );
};

export default ProtonSentinelUpsellModal;
