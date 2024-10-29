import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import { usePlans } from '@proton/components/hooks';
import type { Currency } from '@proton/payments';
import { PLANS } from '@proton/payments';
import { APP_UPSELL_REF_PATH, CYCLE, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import zoomUpsellSvg from '@proton/styles/assets/img/illustrations/upsell-zoom-header.svg';

import NewUpsellModal from '../NewUpsellModal';

interface Props {
    modalProps: ModalStateProps;
}

const ZoomUpsellModal = ({ modalProps }: Props) => {
    const [user] = useUser();

    const currency: Currency = user?.Currency || 'USD';
    const [plansResult] = usePlans();
    const mailPlus = plansResult?.plans?.find(({ Name }) => Name === PLANS.MAIL);

    const amount = (mailPlus?.DefaultPricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

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
        <NewUpsellModal
            titleModal={c('Title').t`Get Zooming faster`}
            description={c('Description')
                .t`Create a Zoom meeting and add joining details to your event with one click.`}
            modalProps={modalProps}
            illustration={zoomUpsellSvg}
            submitText={c('Action').t`Upgrade to Mail Plus`}
            footerText={c('Action').jt`Starting from ${priceUnlimited}`}
            sourceEvent="BUTTON_ZOOM"
            upgradePath={addUpsellPath(
                getUpgradePath({ user }),
                getUpsellRef({
                    app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
                    component: UPSELL_COMPONENT.MODAL,
                    feature: MAIL_UPSELL_PATHS.ZOOM_MEETING,
                })
            )}
        />
    );
};

export default ZoomUpsellModal;
