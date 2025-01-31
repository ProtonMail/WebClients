import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ButtonLike, Href } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import useApi from '@proton/components/hooks/useApi';
import { CYCLE, type Currency, PLANS } from '@proton/payments';
import {
    APPS,
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    PROTON_SENTINEL_NAME,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import {
    UPSELL_MODALS_TYPE,
    addUpsellPath,
    getUpgradePath,
    getUpsellRef,
    sendRequestUpsellModalReport,
    useNewUpsellModalVariant,
} from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import shieldImg from '@proton/styles/assets/img/illustrations/new-upsells-img/shield.svg';
import protonSentinelImage from '@proton/styles/assets/img/illustrations/upsell-proton-sentinel.svg';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const ProtonSentinelUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const [user] = useUser();
    const api = useApi();

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

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

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
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
    }

    return (
        <ModalTwo size="small" {...modalProps} data-testid="security-center:proton-sentinel:upsell-modal">
            <ModalHeader />
            <ModalContent>
                <div className="text-center">
                    <div className="mb-4 rounded">
                        <img src={protonSentinelImage} className="w-full block" alt="" />
                    </div>
                    <h1 className="h3 text-bold mb-4">{c('Title').t`Get advanced protection`}</h1>
                    <p className="color-weak mt-0 mb-4 px-4">
                        {c('Description')
                            .t`Upgrade your account to activate ${PROTON_SENTINEL_NAME}, our cutting-edge AI-driven security solution with dedicated 24/7 expert support.`}
                    </p>
                    <p className="color-weak my-0 px-4 text-bold">
                        {c('Description').t`Designed for users seeking heightened protection for their accounts.`}
                    </p>
                    <ButtonLike
                        as={Href}
                        color="norm"
                        shape="underline"
                        fullWidth
                        href={getKnowledgeBaseUrl('/proton-sentinel')}
                    >
                        {c('Link').t`Learn more`}
                    </ButtonLike>
                </div>
            </ModalContent>
            <ModalFooter>
                <ButtonLike
                    as={SettingsLink}
                    path={addUpsellPath(
                        getUpgradePath({ user }),
                        getUpsellRef({
                            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                            component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
                            feature: MAIL_UPSELL_PATHS.PROTON_SENTINEL,
                        })
                    )}
                    onClick={() => {
                        sendRequestUpsellModalReport({
                            api,
                            application: APPS.PROTONMAIL,
                            sourceEvent: 'BUTTON_SENTINEL',
                            upsellModalType: UPSELL_MODALS_TYPE.OLD,
                        });
                        modalProps.onClose();
                    }}
                    size="large"
                    color="norm"
                    shape="solid"
                    fullWidth
                >
                    {c('new_plans: Action').t`Upgrade now`}
                </ButtonLike>
            </ModalFooter>
        </ModalTwo>
    );
};

export default ProtonSentinelUpsellModal;
