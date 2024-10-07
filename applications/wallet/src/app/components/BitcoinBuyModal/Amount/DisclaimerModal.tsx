import { useState } from 'react';

import { c } from 'ttag';

import type { WasmGatewayProvider } from '@proton/andromeda';
import { Href } from '@proton/atoms';
import type { ModalOwnProps } from '@proton/components';
import { Checkbox, Prompt } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

import { Button } from '../../../atoms';
import { ModalParagraph } from '../../../atoms/ModalParagraph';
import { getGatewayNameByGatewayProvider } from '../../../utils/onramp';

interface Props extends ModalOwnProps {
    provider: WasmGatewayProvider;
    onConfirm: () => void;
    onClose: () => void;
}

const websiteUrlByGatewayProvider: Record<Exclude<WasmGatewayProvider, 'Unsupported'>, string> = {
    Banxa: 'https://banxa.com',
    MoonPay: 'https://www.moonpay.com',
    Ramp: 'https://ramp.network',
};
const termOfUseUrlByGatewayProvider: Record<Exclude<WasmGatewayProvider, 'Unsupported'>, string> = {
    Banxa: 'https://banxa.com/terms-of-use',
    MoonPay: 'https://www.moonpay.com/legal/terms_of_use_row',
    Ramp: 'https://ramp.network/terms-of-service',
};
const privacyAndCookiesPolicyUrlByGatewayProvider: Record<Exclude<WasmGatewayProvider, 'Unsupported'>, string> = {
    Banxa: 'https://banxa.com/privacy-and-cookies-policy',
    MoonPay: 'https://www.moonpay.com/legal/cookie_policy',
    Ramp: 'https://ramp.network/cookie-policy',
};
const supportEmailByGatewayProvider: Record<Exclude<WasmGatewayProvider, 'Unsupported'>, string> = {
    Banxa: 'support@banxa.com',
    MoonPay: 'support@moonpay.com',
    Ramp: 'support@ramp.network',
};

export const DisclaimerModal = ({ provider, onConfirm, onClose, ...modalProps }: Props) => {
    const [hasReadAndAgree, setHasReadAndAgree] = useState(false);

    if (provider === 'Unsupported') {
        return null;
    }

    const providerName = getGatewayNameByGatewayProvider(provider);

    const websiteLink = (
        <Href key="website-link" href={websiteUrlByGatewayProvider[provider]}>
            {websiteUrlByGatewayProvider[provider]}
        </Href>
    );

    const termOfUseLink = (
        <Href key="term-of-use-link" href={termOfUseUrlByGatewayProvider[provider]}>
            {termOfUseUrlByGatewayProvider[provider]}
        </Href>
    );

    const privacyAndCookiesPolicyLink = (
        <Href key="privacy-and-cookies-policy-link" href={privacyAndCookiesPolicyUrlByGatewayProvider[provider]}>
            {privacyAndCookiesPolicyUrlByGatewayProvider[provider]}
        </Href>
    );

    const supportEmailLink = (
        <a key="email-link" href={`mailto:${supportEmailByGatewayProvider[provider]}`}>
            {supportEmailByGatewayProvider[provider]}
        </a>
    );

    return (
        <Prompt
            buttons={[
                <Button
                    fullWidth
                    className="mx-auto"
                    size="large"
                    shape="solid"
                    color="norm"
                    disabled={!hasReadAndAgree}
                    onClick={() => {
                        onConfirm();
                    }}
                >{c('Gateway disclaimer').t`Confirm`}</Button>,
                <Button
                    fullWidth
                    className="mx-auto"
                    size="large"
                    shape="solid"
                    color="weak"
                    onClick={() => {
                        onClose();
                    }}
                >{c('Gateway disclaimer').t`Not now`}</Button>,
            ]}
            actions={[
                <Checkbox
                    onClick={() => {
                        setHasReadAndAgree((prev) => !prev);
                    }}
                >
                    <label className="ml-2">{c('Gateway disclaimer').t`I have read and agree to the disclaimer`}</label>
                </Checkbox>,
            ]}
            {...modalProps}
        >
            <h1 className="text-bold text-break text-3xl mt-3 mb-4 text-center">
                {c('Gateway disclaimer').t`Disclaimer`}
            </h1>
            <ModalParagraph>
                <p>{
                    // translator: This is generic disclaimer we want to print before redirecting to any provider currently support: MoonPay, Banxa and Ramp Network. The text contains the name of the provider as well as links to their own policies. An example with Ramp Network: You are now leaving Proton Wallet for Ramp Network (https://ramp.network). Services related to card payments, bank transfers, and any other fiat transactions are provided by Ramp Network, a separate third-party platform. By proceeding and procuring services from Ramp Network, you acknowledge that you have read and agreed to Ramp Network's Terms of Service (https://ramp.network/terms-of-service) and Privacy and Cookies Policy (https://ramp.network/cookie-policy). For any questions related to Ramp Network's services, please contact Ramp Network at support.ramp.network.
                    c('Gateway disclaimer')
                        .jt`You are now leaving ${WALLET_APP_NAME} for ${providerName} (${websiteLink}). Services related to card payments, bank transfers, and any other fiat transactions are provided by ${providerName}, a separate third-party platform. By proceeding and procuring services from ${providerName}, you acknowledge that you have read and agreed to ${providerName}'s Terms of Service (${termOfUseLink}) and Privacy and Cookies Policy (${privacyAndCookiesPolicyLink}). For any questions related to ${providerName}'s services, please contact ${providerName} at ${supportEmailLink}`
                }</p>
            </ModalParagraph>
        </Prompt>
    );
};
