import { Fragment } from 'react';

import clsx from 'clsx';
import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, Price, SettingsLink, useConfig } from '@proton/components';
import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { TableCell } from '@proton/components/components/topnavbar/TopNavbarPostSignupPromo/PostSignupOneDollar/components/PostSignupOneDollarTable';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';
import { LUMO_APP_NAME, LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { addUpsellPath } from '@proton/shared/lib/helpers/upsell';
import lumoCatLoaf from '@proton/styles/assets/img/lumo/lumo-cat-loaf-upsell.svg';

import { LUMO_PLUS_FREE_PATH_TO_ACCOUNT } from '../../constants';

import './LumoPlusUpsellModal.scss';

interface Feature {
    icon: IconName;
    getText: () => string;
    getTooltip?: () => string;
    free: string;
    plus: string;
}

const features: Feature[] = [
    {
        icon: 'globe',
        // translator: please keep it short
        getText: () => c('collider_2025: Feature').t`Web search`,
        // translator: please keep it short
        free: c('collider_2025: Feature detail').t`Yes`,
        // translator: please keep it short
        plus: c('collider_2025: Feature detail').t`Yes`,
    },
    {
        icon: 'speech-bubble',
        // translator: please keep it short
        getText: () => c('collider_2025: Feature').t`Weekly chats`,
        // translator: please keep it short
        free: c('collider_2025: Feature detail').t`Limited`,
        // translator: please keep it short
        plus: c('collider_2025: Feature detail').t`Unlimited`,
    },
    {
        icon: 'clock-rotate-left',
        // translator: please keep it short
        getText: () => c('collider_2025: Feature').t`Chat history`,
        // translator: please keep it short
        free: c('collider_2025: Feature detail').t`Limited`,
        // translator: please keep it short
        plus: c('collider_2025: Feature detail').t`Unlimited`,
    },
    {
        icon: 'star',
        // translator: please keep it short
        getText: () => c('collider_2025: Feature').t`Favorite chats`,
        // translator: please keep it short
        free: c('collider_2025: Feature detail').t`Limited`,
        // translator: please keep it short
        plus: c('collider_2025: Feature detail').t`Unlimited`,
    },
    {
        icon: 'arrow-up-line',
        // translator: please keep it short
        getText: () => c('collider_2025: Feature').t`File uploads`,
        // translator: please keep it short
        free: c('collider_2025: Feature detail').t`Small files`,
        // translator: please keep it short
        plus: c('collider_2025: Feature detail').t`Large files`,
    },
    {
        icon: 'chip',
        // translator: please keep it short
        getText: () => c('collider_2025: Feature').t`Advanced models`,
        // translator: please keep it short
        free: c('collider_2025: Feature detail').t`No`,
        // translator: please keep it short
        plus: c('collider_2025: Feature detail').t`Yes`,
    },
];

interface Props {
    modalProps: ModalStateProps;
    upsellRef?: string;
}

// TODO: Add the logic to refresh after subscription is completed

const LumoPlusUpsellModal = ({ modalProps, upsellRef }: Props) => {
    // const [openSubscriptionModal] = useSubscriptionModal();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const { APP_NAME } = useConfig();

    const lumoPlusModalUpsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: LUMO_UPSELL_PATHS.LUMO_PLUS_UPGRADE_MODAL,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: APP_NAME,
    });
    const upgradeUrl = addUpsellPath(LUMO_PLUS_FREE_PATH_TO_ACCOUNT, lumoPlusModalUpsellRef);

    // const handleSubscriptionModalSubscribed = () => {
    //     modalProps.onClose();
    //     sendSubscriptionModalSubscribedEvent(upsellRef);
    // };

    // const handleOpenSubscriptionModal = () => {
    //     modalProps.onClose();

    //     sendSubscriptionModalInitializedEvent(upsellRef);

    //     openSubscriptionModal({
    //         step: SUBSCRIPTION_STEPS.CHECKOUT,
    //         disablePlanSelection: true,
    //         maximumCycle: CYCLE.YEARLY,
    //         plan: PLANS.LUMO,
    //         onSubscribed: () => {
    //             handleSubscriptionModalSubscribed();
    //         },
    //         metrics: {
    //             source: 'upsells',
    //         },
    //         upsellRef,
    //     });
    // };

    if (plansMapLoading) {
        return <Loader />;
    }

    const lumoPlan = plansMap[PLANS.LUMO];

    if (!lumoPlan) {
        return <Loader />;
    }
    const monthlyAmount = (lumoPlan.Pricing[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const price = (
        <Price currency={lumoPlan.Currency} suffix={c('Suffix').t`/month`} key="monthlyAmount">
            {monthlyAmount}
        </Price>
    );

    const title = c('collider_2025: Title').t`Elevate your AI experience`;
    const description = c('collider_2025: Description')
        .t`Unlock advanced models and premium features with ${LUMO_APP_NAME} Plus.`;
    return (
        <ModalTwo
            className="modal-two--twocolors modal-two--upsell-lumoplus"
            // data-testid={dataTestid}
            {...modalProps}
            // onClose={handleClose}
        >
            <div className="modal-two--upsell-lumoplus-gradient">
                <ModalTwoHeader />
                <div className="modal-two-illustration-container relative text-center">
                    <img src={lumoCatLoaf} alt="" />
                </div>
            </div>
            <div className="modal-two-content-container overflow-auto">
                <ModalTwoContent className="my-4 text-center">
                    <h1 className="h3 text-semibold">{title}</h1>
                    {description && <p className="mt-2 mb-6 text-wrap-balance color-weak">{description}</p>}
                    <div className="feature-table-layout w-full mb-4">
                        <span />
                        <p className="m-0 py-2 text-semibold px-1 mr-1 text-center">{c('Offer feature').t`Free`}</p>
                        <div className="flex items-center table-rounded py-1 px-1 bg-weak text-center text-semibold">
                            <p className="m-0 flex-1 py-1 rounded">{c('Offer feature').t`Plus`}</p>
                        </div>
                        {features.map((feature, index) => {
                            const isNotLast = index !== features.length - 1;
                            const borderClasses = isNotLast && 'border-bottom border-weak';

                            return (
                                <Fragment key={index}>
                                    <TableCell
                                        content={
                                            <div className="text-left flex flex-row flex-nowrap items-start gap-2">
                                                <Icon className="color-primary shrink-0 mt-px" name={feature.icon} />
                                                {feature.getText()}
                                            </div>
                                        }
                                        className={clsx('feature-table-item m-0 py-3', borderClasses)}
                                    />
                                    <TableCell
                                        content={feature.free}
                                        className={clsx(
                                            'feature-table-item m-0 py-3 flex items-center justify-center',
                                            borderClasses
                                        )}
                                    />
                                    <TableCell
                                        content={feature.plus}
                                        className={clsx(
                                            'feature-table-item m-0 py-3 flex items-center justify-center bg-weak',
                                            borderClasses
                                        )}
                                    />
                                </Fragment>
                            );
                        })}
                        {/*<SubscriptionCycleSelector />*/}
                    </div>
                    <div className="flex flex-column gap-2 mt-6">
                        <ButtonLike
                            // as={undefined}
                            as={SettingsLink}
                            path={upgradeUrl}
                            // onClick={handleOpenSubscriptionModal}
                            size="large"
                            color="norm"
                            shape="solid"
                            fullWidth
                            className="lumo-payment-trigger" //do not remove, being used by lumo mobile
                        >
                            {c('collider_2025: Action').jt`Get ${LUMO_SHORT_APP_NAME} Plus from only ${price}`}
                        </ButtonLike>
                        <Button
                            shape="ghost"
                            color="norm"
                            size="large"
                            fullWidth
                            onClick={() => modalProps.onClose()}
                        >{c('collider_2025: Action').t`Use ${LUMO_SHORT_APP_NAME} Free instead`}</Button>
                    </div>
                </ModalTwoContent>
            </div>
        </ModalTwo>
    );
};

export default LumoPlusUpsellModal;
