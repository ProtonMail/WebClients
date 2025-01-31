import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { CYCLE, type Currency, PLANS, PLAN_NAMES } from '@proton/payments';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import {
    addUpsellPath,
    getUpgradePath,
    getUpsellRef,
    useNewUpsellModalVariant,
} from '@proton/shared/lib/helpers/upsell';
import identityImg from '@proton/styles/assets/img/illustrations/new-upsells-img/identity.svg';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const PassAliasesUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const [user] = useUser();

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

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                data-testid="security-center:proton-sentinel:upsell-modal"
                titleModal={c('Title').t`Need more aliases?`}
                description={c('Description')
                    .t`You’ve already created 10 aliases. Get unlimited aliases and 500 GB of storage with ${BRAND_NAME} Unlimited.`}
                modalProps={modalProps}
                submitText={c('Action').t`Upgrade to ${BRAND_NAME} Unlimited`}
                footerText={c('Action').jt`Starting from ${priceUnlimited}`}
                illustration={identityImg}
                sourceEvent="BUTTON_PASS_ALIASES"
                upgradePath={addUpsellPath(
                    getUpgradePath({
                        user,
                        plan: PLANS.BUNDLE,
                        app: 'proton-mail',
                    }),
                    getUpsellRef({
                        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
                        feature: MAIL_UPSELL_PATHS.PASS_ALIASES,
                    })
                )}
            />
        );
    }

    return (
        <UpsellModal
            data-testid="security-center:proton-sentinel:upsell-modal"
            modalProps={modalProps}
            features={[]}
            description={c('Description')
                .t`Get unlimited aliases and 500 GB of storage with ${PLAN_NAMES[PLANS.BUNDLE]}.`}
            title={c('Title').t`Need more aliases?`}
            sourceEvent="BUTTON_PASS_ALIASES"
            upgradePath={addUpsellPath(
                getUpgradePath({
                    user,
                    plan: PLANS.BUNDLE,
                    app: 'proton-mail',
                }),
                getUpsellRef({
                    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                    component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
                    feature: MAIL_UPSELL_PATHS.PASS_ALIASES,
                })
            )}
        />
    );
};

export default PassAliasesUpsellModal;
