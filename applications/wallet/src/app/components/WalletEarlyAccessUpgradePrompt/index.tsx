import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import type { ModalOwnProps } from '@proton/components/components';
import { Icon, Logo, Prompt, ProtonForBusinessLogo, Tooltip, useModalState } from '@proton/components/components';
import { SUBSCRIPTION_STEPS, useAddresses, useSubscriptionModal, useUser } from '@proton/components/index';
import { CacheType } from '@proton/redux-utilities';
import { APPS, BRAND_NAME, PLANS, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getAppStaticUrl, getStaticURL } from '@proton/shared/lib/helpers/url';
import walletClock from '@proton/styles/assets/img/wallet/wallet-clock.jpg';
import clsx from '@proton/utils/clsx';
import { useUserWalletSettings } from '@proton/wallet';

import { Button, CoreButtonLike, Modal } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { useGetUserEligibility } from '../../store/hooks/useUserEligibility';
import { getTermAndConditionsSentence } from '../../utils/legal';

export const WalletEarlyAccessUpgradePrompt = ({ ...modalProps }: ModalOwnProps) => {
    const [exploreProtonModal, setExploreProtonModal] = useModalState();
    const [addresses] = useAddresses();
    const [primaryAddress] = addresses ?? [];
    const getUserEligibility = useGetUserEligibility();
    const [user] = useUser();
    const [walletSettings] = useUserWalletSettings();

    const [openSubscriptionModal] = useSubscriptionModal();

    const products = [
        {
            app: APPS.PROTONMAIL,
            text: c('Wallet explore proton').t`Encrypted email that's private by default.`,
        },
        {
            app: APPS.PROTONCALENDAR,
            text: c('Wallet explore proton').t`Your calendar is a record of your life. Keep it safe.`,
        },
        {
            app: APPS.PROTONDRIVE,
            text: c('Wallet explore proton').t`Secure cloud storage that gives you control of your data.`,
        },
        {
            app: APPS.PROTONPASS,
            text: c('Wallet explore proton').t`An encrypted password manager that protects your online identity.`,
        },
    ];

    const email = (
        <span key="user-email" className="text-semibold">
            {primaryAddress.Email}
        </span>
    );

    const { onClose, onExit, open } = exploreProtonModal;
    const modalPropsWithoutKey = { onClose, onExit, open };

    return (
        <>
            <Prompt
                size="large"
                footnote={walletSettings.AcceptTermsAndConditions ? undefined : getTermAndConditionsSentence()}
                buttons={[
                    <Tooltip title={!user.canPay && c('Wallet upgrade').t`Contact your administrator to upgrade`}>
                        <Button
                            fullWidth
                            size="large"
                            shape="solid"
                            color="norm"
                            className="block"
                            disabled={!user.canPay}
                            onClick={() => {
                                openSubscriptionModal({
                                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                                    disablePlanSelection: true,
                                    plan: PLANS.VISIONARY,
                                    onSubscribed: () => {
                                        void getUserEligibility({ cache: CacheType.None });
                                    },
                                    metrics: {
                                        source: 'upsells',
                                    },
                                });
                            }}
                        >{c('Wallet').t`Upgrade to Visionary`}</Button>
                    </Tooltip>,
                    <Button
                        fullWidth
                        size="large"
                        shape="solid"
                        color="weak"
                        className="block"
                        onClick={() => {
                            setExploreProtonModal(true);
                        }}
                    >{c('Wallet').t`Explore other ${BRAND_NAME} products`}</Button>,
                ]}
                {...modalProps}
            >
                <div className="flex flex-column items-center text-center">
                    <img
                        src={walletClock}
                        alt=""
                        className="w-custom h-custom"
                        style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                    />
                    <h1 className="my-3 text-semibold text-3xl">{c('Wallet Welcome').t`Early Access Waitlist`}</h1>
                    <ModalParagraph prompt>
                        <p>{c('Wallet Welcome')
                            .jt`You have been added to the first come, first serve waiting list. We will notify you at ${email} once we have more server capacity.`}</p>
                        <p>{c('Wallet Welcome')
                            .t`Invites from active users of ${WALLET_APP_NAME} will allow you to skip this waiting list.`}</p>
                        <p>{c('Wallet Welcome')
                            .t`You can also support us and get immediate access by upgrading to ${BRAND_NAME} Visionary, our most premium plan with paid features in all ${BRAND_NAME} products.`}</p>
                    </ModalParagraph>
                </div>
            </Prompt>

            <Modal {...modalPropsWithoutKey} enableCloseWhenClickOutside hasClose={false}>
                {products.map(({ app, text }, index) => {
                    return (
                        <div
                            key={app}
                            className={clsx(
                                'flex flex-row flex-nowrap items-center space-between py-3',
                                !!index && 'border-top'
                            )}
                        >
                            <div className="flex flex-column items-start grow">
                                <Logo appName={app} />
                                <p className="my-2 color-weak">{text}</p>
                            </div>
                            <CoreButtonLike
                                as={Href}
                                className="rounded-full shrink-0"
                                shape="ghost"
                                icon
                                target="_blank"
                                href={getAppStaticUrl(app)}
                            >
                                <Icon name="chevron-right" />
                            </CoreButtonLike>
                        </div>
                    );
                })}

                <div
                    key="business"
                    className={clsx('flex flex-row flex-nowrap items-center space-between py-3 border-top')}
                >
                    <div className="flex flex-column items-start grow">
                        <ProtonForBusinessLogo withBackground={false} />
                        <p className="my-2 color-weak">{c('Wallet explore proton')
                            .t`Improve the security of your business and comply with data protection laws.`}</p>
                    </div>
                    <CoreButtonLike
                        as={Href}
                        className="rounded-full shrink-0"
                        shape="ghost"
                        icon
                        target="_blank"
                        href={getStaticURL('/business')}
                    >
                        <Icon name="chevron-right" />
                    </CoreButtonLike>
                </div>
            </Modal>
        </>
    );
};
