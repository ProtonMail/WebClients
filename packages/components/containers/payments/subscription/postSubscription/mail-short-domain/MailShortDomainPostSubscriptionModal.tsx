import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms/index';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useShortDomainAddress from '@proton/components/hooks/mail/useShortDomainAddress';
import useNotifications from '@proton/components/hooks/useNotifications';
import { TelemetryMailPostSubscriptionEvents } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Address } from '@proton/shared/lib/interfaces';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import { PostSubscriptionLoadingModalContent } from '../PostSubscriptionLoadingModal';
import type { PostSubscriptionModalComponentProps } from '../interface';
import { usePostSubscriptionTelemetry } from '../usePostSubscriptionTelemetry';
import useMailShortDomainPostSubscriptionComposerSpotlight from './useMailShortDomainPostSubscriptionSpotlight';

const MailShortDomainPostSubscriptionModal = ({ onClose, step }: PostSubscriptionModalComponentProps) => {
    const { createNotification } = useNotifications();
    const location = useLocation();
    const goToSettings = useSettingsLink();
    const [displayLoadingModal, setDisplayLoadingModal] = useState(true);
    const sendTelemetryEvent = usePostSubscriptionTelemetry();

    const { shortDomainAddress, createShortDomainAddress, loadingDependencies } = useShortDomainAddress();
    const getAddresses = useGetAddresses();
    const composerSpotlight = useMailShortDomainPostSubscriptionComposerSpotlight();

    const isAddressSetupRef = useRef(false);
    const setupNewAddress = async () => {
        try {
            const addresses = await getAddresses();

            // Prepare next signature
            const nextAddressSignature = ((prevAddress: Address, nextEmailAddress: string) => {
                if (!prevAddress.Signature) {
                    return;
                }
                return prevAddress.Signature.replaceAll(prevAddress.Email, nextEmailAddress);
            })(addresses[0], shortDomainAddress);

            // Create address
            await createShortDomainAddress({
                setDefault: true,
                addressSignature: nextAddressSignature,
            });

            // Activate composer spotlight
            void composerSpotlight.setActive();
        } catch (error) {
            traceInitiativeError('post-subscription', error);
        }

        isAddressSetupRef.current = true;
    };

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

    const handleClickContinue = () => {
        void sendTelemetryEvent({
            event: TelemetryMailPostSubscriptionEvents.modal_engagement,
            dimensions: {
                modal: 'mail-short-domain',
                modalAction: 'primary_cta',
            },
        });
        onClose();
    };

    const handleClickSettings = () => {
        void sendTelemetryEvent({
            event: TelemetryMailPostSubscriptionEvents.modal_engagement,
            dimensions: {
                modal: 'mail-short-domain',
                modalAction: 'secondary_cta',
            },
        });
        goToSettings('/identity-addresses', APPS.PROTONMAIL);
    };

    useEffect(() => {
        if (!loadingDependencies && step === SUBSCRIPTION_STEPS.THANKS && !isAddressSetupRef.current) {
            const hideLoadingModal = () => {
                setDisplayLoadingModal(false);
            };
            setupNewAddress().then(hideLoadingModal, hideLoadingModal);
        }
    }, [loadingDependencies, step]);

    if (displayLoadingModal || step === SUBSCRIPTION_STEPS.UPGRADE) {
        return (
            <PostSubscriptionLoadingModalContent
                title={
                    step === SUBSCRIPTION_STEPS.UPGRADE
                        ? c('Info').t`Registering your subscription...`
                        : c('Info').t`Setting up your new address...`
                }
            />
        );
    }

    if (step === SUBSCRIPTION_STEPS.THANKS) {
        return (
            <>
                <ModalTwoHeader />
                <div className="modal-two-illustration-container relative text-center fade-in-up">
                    <img src={illustration} alt="" width="128" height="128" />
                </div>
                <div className="modal-two-content-container fade-in-up">
                    <ModalTwoContent className="my-8">
                        <h1 className="text-lg text-bold text-center mb-0">{c('Title').t`Upgrade complete!`}</h1>
                        <h2 className="text-lg text-center mt-0 mb-4">{c('Title')
                            .t`Your shorter address is now ready`}</h2>
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
                            <Button className="mb-2" color="norm" fullWidth onClick={handleClickContinue}>
                                {c('Button').t`Continue`}
                            </Button>
                            {!isIdentityAndAddressPage && (
                                <Button fullWidth onClick={handleClickSettings}>{c('Button')
                                    .t`Change email address settings`}</Button>
                            )}
                        </div>
                    </ModalTwoContent>
                </div>
            </>
        );
    }

    return null;
};

export default MailShortDomainPostSubscriptionModal;
