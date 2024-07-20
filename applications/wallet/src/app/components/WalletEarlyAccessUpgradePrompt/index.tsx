import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import type { ModalOwnProps } from '@proton/components/components';
import { Icon, Logo, Prompt, ProtonForBusinessLogo, useModalState } from '@proton/components/components';
import { SUBSCRIPTION_STEPS, useAddresses, useSubscriptionModal } from '@proton/components/index';
import { CacheType } from '@proton/redux-utilities';
import { APPS, BRAND_NAME, PLANS, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getAppStaticUrl, getStaticURL } from '@proton/shared/lib/helpers/url';
import walletPlaneImg from '@proton/styles/assets/img/illustrations/wallet-sending-plane.svg';
import clsx from '@proton/utils/clsx';

import { Button, CoreButtonLike, Modal } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { APP_NAME } from '../../config';
import { useGetUserEligibility } from '../../store/hooks/useUserEligibility';

const termsLink = `${getAppStaticUrl(APP_NAME)}/legal/terms`;

export const WalletEarlyAccessUpgradePrompt = ({ ...modalProps }: ModalOwnProps) => {
    const [exploreProtonModal, setExploreProtonModal] = useModalState();
    const [addresses] = useAddresses();
    const [primaryAddress] = addresses ?? [];
    const getUserEligibility = useGetUserEligibility();

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

    const termsAndConditionsLink = <Href className="" href={termsLink}>{`terms and conditions`}</Href>;

    return (
        <>
            <Prompt
                size="large"
                footnote={c('Wallet Upgrade').jt`By continuing, you agree to our ${termsAndConditionsLink}`}
                buttons={[
                    <Button
                        fullWidth
                        size="large"
                        shape="solid"
                        color="norm"
                        className="block"
                        onClick={() => {
                            openSubscriptionModal({
                                step: SUBSCRIPTION_STEPS.CHECKOUT,
                                disablePlanSelection: true,
                                plan: PLANS.VISIONARY,
                                onSubscribed: () => {
                                    void getUserEligibility({ cache: CacheType.None });
                                },
                                metrics: {
                                    source: 'automatic', // TODO: not let this like that, ask payments how to add `wallet-early-access`,
                                },
                            });
                        }}
                    >{c('Wallet').t`Upgrade to Visionary`}</Button>,
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
                        src={walletPlaneImg}
                        alt=""
                        className="w-custom h-custom"
                        style={{ '--w-custom': '240px', '--h-custom': '135px' }}
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

            <Modal {...exploreProtonModal} enableCloseWhenClickOutside hasClose={false}>
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
