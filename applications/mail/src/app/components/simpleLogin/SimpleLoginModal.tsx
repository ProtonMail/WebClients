import { useState } from 'react';

import { c } from 'ttag';

import {
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useApi,
} from '@proton/components';
import { createSLUser } from '@proton/shared/lib/api/simpleLogin';
import { TelemetrySimpleLoginEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, SIMPLE_LOGIN_EXTENSION_LINKS } from '@proton/shared/lib/constants';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import connectSimpleLoginSvg from '@proton/styles/assets/img/illustrations/connect-simple-login.svg';

import { useSimpleLoginExtension } from '../../hooks/simpleLogin/useSimpleLoginExtension';
import { useSimpleLoginTelemetry } from '../../hooks/simpleLogin/useSimpleLoginTelemetry';

import './SimpleLoginModal.scss';

interface Props extends ModalProps {}

const SimpleLoginModal = ({ ...rest }: Props) => {
    const [loading, setLoading] = useState(false);
    const { canUseExtension } = useSimpleLoginExtension();
    const { handleSendTelemetryData } = useSimpleLoginTelemetry();
    const api = useApi();

    const { onClose } = rest;

    const installAndGoText = isSafari()
        ? // translator: Full sentence "Your Proton Account includes SimpleLogin. Install the browser extension with one click to get started.""
          c('Info')
              .t`Your ${BRAND_NAME} Account includes SimpleLogin. Install the browser extension with one click to get started.`
        : // translator: Full sentence "SimpleLogin is a Proton service, and your Proton Account includes Hide My Email aliases. To start masking your email address, go to SimpleLogin and create your first alias."
          c('Info')
              .t`SimpleLogin is a ${BRAND_NAME} service, and your ${BRAND_NAME} Account includes Hide My Email aliases. To start masking your email address, go to SimpleLogin and create your first alias.`;

    const handlePluginAction = async () => {
        setLoading(true);

        let url = '';
        // In Safari there is no browser extension, so we redirect to the SL dashboard
        if (isSafari()) {
            void api(createSLUser());
            url = SIMPLE_LOGIN_EXTENSION_LINKS.DASHBOARD;
        } else {
            // Otherwise, we can open the extension
            const { Redirect } = await api(createSLUser('browser_extension'));
            url = Redirect;
        }
        setLoading(false);

        // We need to send a telemetry request when the user clicks on the go to SL button
        handleSendTelemetryData(TelemetrySimpleLoginEvents.go_to_simplelogin, {}, true);

        window.open(url, '_blank');
        onClose?.();
    };

    const getButtonText = () => {
        if (!canUseExtension) {
            return c('Action').t`Go to SimpleLogin`;
        }
        return c('Action').t`Get SimpleLogin extension`;
    };

    return (
        <ModalTwo {...rest} className="simple-login-modal">
            <ModalTwoHeader title={c('Title').t`Hide your email with SimpleLogin by Proton`} />
            <ModalTwoContent>
                <div className="text-center">
                    <img src={connectSimpleLoginSvg} alt={c('Alternative text for SimpleLogin image').t`SimpleLogin`} />
                </div>
                <div>{c('Info')
                    .t`SimpleLogin provides a simple way to create logins at untrusted third-party sites where you don't want to expose your actual email address.`}</div>
                <br />
                <div className="mb0-5">
                    <strong>{c('Info').t`How Hide My Email works`}</strong>
                </div>
                <ul className="mt0 mb0">
                    <li className="mb1">{c('Info')
                        .t`When giving out your email, use a unique, disposable Hide My Email alias instead of your real email address.`}</li>
                    <li className="mb1">{c('Info')
                        .t`Email is forwarded to your mailbox; your email address stays hidden.`}</li>
                    <li>{c('Info')
                        .t`If your alias is sold, leaked, or abused, simply disable it to stop receiving spam.`}</li>
                </ul>
                <br />
                <div className="mb0-5">
                    <strong>{c('Info').t`Using SimpleLogin is easy`}</strong>
                </div>
                <div>{installAndGoText}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <PrimaryButton onClick={handlePluginAction} className="mlauto" loading={loading}>
                    {getButtonText()}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SimpleLoginModal;
