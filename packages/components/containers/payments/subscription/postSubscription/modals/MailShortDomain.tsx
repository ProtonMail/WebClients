import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms/index';
import {
    Copy,
    Icon,
    ModalTwoContent,
    ModalTwoHeader,
    useNotifications,
    useSettingsLink,
    useShortDomainAddress,
} from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { APPS } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Address } from '@proton/shared/lib/interfaces';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import type { PostSubscriptionModalComponentProps } from '../interface';

enum MAIL_SHORT_DOMAIN_SPOTLIGHT {
    /** Not visible, can't be displayed to user */
    DEFAULT = 'DEFAULT',
    /** Ready to be viewed by user */
    ACTIVE = 'ACTIVE',
    /** User saw the spotlight */
    VIEWED = 'VIEWED',
}

export const useMailShortDomainPostSubscriptionComposerSpotlight = () => {
    const shortDomainSpotlightFlag = useFeature<MAIL_SHORT_DOMAIN_SPOTLIGHT>(
        FeatureCode.PostSubscriptionShortDomainSpotlight
    );

    return {
        canDisplay: MAIL_SHORT_DOMAIN_SPOTLIGHT.ACTIVE === shortDomainSpotlightFlag.feature?.Value,
        hasViewed: MAIL_SHORT_DOMAIN_SPOTLIGHT.VIEWED === shortDomainSpotlightFlag.feature?.Value,
        setViewed: () => shortDomainSpotlightFlag.update(MAIL_SHORT_DOMAIN_SPOTLIGHT.VIEWED),
        setActive: () => shortDomainSpotlightFlag.update(MAIL_SHORT_DOMAIN_SPOTLIGHT.ACTIVE),
        loading: shortDomainSpotlightFlag.loading,
    };
};

const MailShortDomainPostSubscriptionModal = ({ onClose }: PostSubscriptionModalComponentProps) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const location = useLocation();
    const { shortDomainAddress, createShortDomainAddress, loadingDependencies } = useShortDomainAddress();
    const getAddresses = useGetAddresses();
    const goToSettings = useSettingsLink();
    const composerSpotlight = useMailShortDomainPostSubscriptionComposerSpotlight();

    const isIdentityAndAddressPage = location.pathname.includes('/identity-addresses');

    // translator complete sentence: This is now your <>default email address<> for sending new messages.
    const defaultEmailAddress = <b key="default-email-adress">{c('Info').t`default email address`}</b>;
    const listItems = [
        {
            icon: 'arrow-out-square',
            text: c('Info').t`Start sharing it with contacts and use it for online services.`,
        },
        {
            icon: 'at',
            // translator complete sentence: This is now your <>default email address<> for sending new messages.
            text: c('Info').jt`This is now your ${defaultEmailAddress} for sending new messages.`,
        },
        {
            icon: 'inbox',
            text: c('Info').t`Messages to all your email addresses will go to your inbox.`,
        },
    ] as const;

    const setupNewAddress = async () => {
        try {
            const addresses = await getAddresses();
            const nextAddressSignature = ((prevAddress: Address, nextEmailAddress: string) => {
                if (!prevAddress.Signature) {
                    return;
                }
                return prevAddress.Signature.replaceAll(prevAddress.Email, nextEmailAddress);
            })(addresses[0], shortDomainAddress);

            await createShortDomainAddress({
                setDefault: true,
                addressSignature: nextAddressSignature,
            });

            void composerSpotlight.setActive();
        } catch (error) {
            traceInitiativeError('post-subscription', error);
            onClose();
        }
    };

    useEffect(() => {
        if (!loadingDependencies) {
            void withLoading(setupNewAddress);
        }
    }, [loadingDependencies]);

    return (
        <>
            <ModalTwoHeader />
            <div className="modal-two-illustration-container relative text-center">
                <img src={illustration} alt="" width="128" height="128" />
            </div>
            <div className="modal-two-content-container">
                <ModalTwoContent className="my-8">
                    <h1 className="text-lg text-bold text-center mb-0">{c('Title').t`Upgrade complete!`}</h1>
                    <h2 className="text-lg text-center mt-0 mb-4">{c('Title').t`Your shorter address is now ready`}</h2>
                    <div className="mb-4 rounded bg-weak text-center">
                        {shortDomainAddress}{' '}
                        <Copy
                            value={shortDomainAddress}
                            shape="ghost"
                            onCopy={() => createNotification({ text: c('Info').t`Address copied to clipboard` })}
                        />
                    </div>
                    <ul className="unstyled">
                        {listItems.map(({ icon, text }) => (
                            <li key={icon} className="flex items-start flex-justify flex-nowrap mb-4">
                                <span
                                    className="mr-3 shrink-0 bg-weak rounded-full w-custom h-custom flex items-center justify-center"
                                    style={{
                                        '--w-custom': '2rem',
                                        '--h-custom': '2rem',
                                    }}
                                >
                                    <Icon name={icon} />
                                </span>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                    <div>
                        <Button
                            className="mb-2"
                            color="norm"
                            fullWidth
                            loading={loadingDependencies || loading}
                            onClick={onClose}
                        >{c('Button').t`Continue`}</Button>
                        {!isIdentityAndAddressPage && (
                            <Button
                                fullWidth
                                onClick={() => {
                                    goToSettings('/identity-addresses', APPS.PROTONMAIL);
                                }}
                            >{c('Button').t`Change email address settings`}</Button>
                        )}
                    </div>
                </ModalTwoContent>
            </div>
        </>
    );
};

export default MailShortDomainPostSubscriptionModal;
