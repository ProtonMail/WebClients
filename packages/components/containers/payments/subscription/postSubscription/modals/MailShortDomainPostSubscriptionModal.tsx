import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useShortDomainAddress from '@proton/components/hooks/mail/useShortDomainAddress';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { APPS } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContentWrapper,
    PostSubscriptionModalHeader,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

interface ConfirmationModalContentProps extends PostSubscriptionModalComponentProps {
    shortDomainAddress: string;
}
const ConfirmationModalContent = ({
    shortDomainAddress,
    onDisplayFeatureTour,
    onRemindMeLater,
}: ConfirmationModalContentProps) => {
    const { createNotification } = useNotifications();
    const { APP_NAME } = useConfig();

    // translator complete sentence: This is now your <>default email address<> for sending new messages.
    const defaultEmailAddress = <b key="default-email-adress">{c('Info').t`default email address`}</b>;
    const listItems = [
        {
            icon: 'arrow-within-square',
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

    const settingsLink = (
        <SettingsLink key="id-address-settings-link" path="/identity-addresses" app={APPS.PROTONMAIL}>{c('Link')
            .t`settings`}</SettingsLink>
    );

    return (
        <>
            <PostSubscriptionModalHeader illustration={illustration} />
            <PostSubscriptionModalContentWrapper
                footer={
                    <>
                        <Button className="mb-2" color="norm" fullWidth onClick={onDisplayFeatureTour}>
                            {c('Button').t`Set up other features`}
                        </Button>
                        <Button fullWidth onClick={onRemindMeLater}>{c('Button').t`Remind me later`}</Button>
                    </>
                }
            >
                <h1 className="text-lg text-bold text-center mb-0">{c('Title').t`Upgrade complete!`}</h1>
                <h2 className="text-lg text-center mt-0 mb-4">{c('Title').t`Your shorter address is now ready`}</h2>
                <div className="mb-4 pl-2 rounded bg-weak text-center flex flex-nowrap justify-space-between items-center">
                    <div className="text-ellipsis" title={shortDomainAddress}>
                        {shortDomainAddress}{' '}
                    </div>
                    <div className="shrink-0">
                        <Copy
                            value={shortDomainAddress}
                            shape="ghost"
                            onCopy={() => createNotification({ text: c('Info').t`Address copied to clipboard` })}
                        />
                    </div>
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
                {APP_NAME !== 'proton-account' && (
                    <p className="color-weak text-center m-0">{
                        // translator complete sentence: You can change this anytime in <>settings<>
                        c('Info').jt`You can change this anytime in ${settingsLink}.`
                    }</p>
                )}
            </PostSubscriptionModalContentWrapper>
        </>
    );
};

const MailShortDomainPostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const { modalProps, step } = props;
    const [displayLoadingModal, setDisplayLoadingModal] = useState(true);

    const { shortDomainAddress, createShortDomainAddress, loadingDependencies, hasShortDomain } =
        useShortDomainAddress();
    const getAddresses = useGetAddresses();
    const isAddressSetupRef = useRef(false);

    useEffect(() => {
        if (!loadingDependencies && step === SUBSCRIPTION_STEPS.THANKS && !isAddressSetupRef.current) {
            const setupNewAddress = async () => {
                try {
                    const addresses = await getAddresses();

                    if (hasShortDomain(addresses)) {
                        return;
                    }

                    // Create address
                    await createShortDomainAddress({
                        setDefault: true,
                        replaceAddressSignature: true,
                    });
                } catch (error) {
                    traceInitiativeError('post-subscription', error);
                }

                isAddressSetupRef.current = true;
            };

            const hideLoadingModal = () => {
                setDisplayLoadingModal(false);
            };

            setupNewAddress().then(hideLoadingModal, hideLoadingModal);
        }
    }, [loadingDependencies, step]);

    const canCloseModal = step === SUBSCRIPTION_STEPS.THANKS && !displayLoadingModal;

    return (
        <PostSubscriptionModalWrapper {...modalProps} canClose={canCloseModal}>
            {canCloseModal ? (
                <ConfirmationModalContent shortDomainAddress={shortDomainAddress} {...props} />
            ) : (
                <PostSubscriptionModalLoadingContent
                    height="high"
                    title={
                        step === SUBSCRIPTION_STEPS.UPGRADE
                            ? c('Info').t`Registering your subscription…`
                            : c('Info').t`Setting up your new address…`
                    }
                />
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default MailShortDomainPostSubscriptionModal;
