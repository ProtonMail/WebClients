import { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import Text from './Text';

import { Alert, Href, Tabs } from '../../../components';
import useApi from '../../../hooks/useApi';

import { CaptchaTheme, HumanVerificationSteps, OwnershipCache, VerificationModel } from './interface';
import { getAvailableMethods } from './helper';
import Captcha from './Captcha';
import './HumanVerificationModal.scss';
import OwnershipMethod from './OwnershipMethod';
import CodeMethod from './CodeMethod';

interface Props {
    onSubmit: (token: string, tokenType: HumanVerificationMethodType) => void;
    onClose: () => void;
    onLoaded?: () => void;
    onError?: (error: unknown) => void;
    token: string;
    methods: HumanVerificationMethodType[];
    defaultEmail?: string;
    defaultPhone?: string;
    defaultCountry?: string;
    step: HumanVerificationSteps;
    isEmbedded?: boolean;
    onChangeStep: (step: HumanVerificationSteps) => void;
    theme?: CaptchaTheme;
}

type SupportedHumanVerificationMethodType = keyof ReturnType<typeof getAvailableMethods>;

const HumanVerificationForm = ({
    defaultCountry,
    defaultEmail,
    defaultPhone,
    methods,
    token,
    theme,
    onSubmit,
    onClose,
    onLoaded,
    onError = onClose,
    step,
    isEmbedded,
    onChangeStep,
}: Props) => {
    const api = useApi();

    const availableMethods = getAvailableMethods(methods);
    const [selectedMethod, setSelectedMethod] = useState<SupportedHumanVerificationMethodType>(() => {
        const firstAvailableMethod = Object.entries(availableMethods).find(([, available]) => available)?.[0] as
            | SupportedHumanVerificationMethodType
            | undefined;
        return firstAvailableMethod || 'captcha';
    });

    const loadedOnceRef = useRef(false);
    const handleLoaded = () => {
        if (loadedOnceRef.current) {
            return;
        }
        onLoaded?.();
        loadedOnceRef.current = true;
    };

    useEffect(() => {
        // If either the ownership verification method is not selected (captcha or otherwise is selected), or
        // if it is selected and the verification model is available, the `onLoaded` callback is triggered
        // This is specifically intended for the verify app so that there's just a single loading spinner.
        if (selectedMethod === 'captcha' || selectedMethod === 'invite') {
            handleLoaded();
        }
    }, [onLoaded, selectedMethod]);

    const ownershipCacheRef = useRef<OwnershipCache>({ 'ownership-sms': {}, 'ownership-email': {} });
    const verificationModelCacheRef = useRef<VerificationModel | undefined>(undefined);

    const codeMethod = (
        <CodeMethod
            method={selectedMethod === 'sms' ? 'sms' : 'email'}
            defaultCountry={defaultCountry}
            defaultPhone={defaultPhone}
            defaultEmail={defaultEmail}
            api={api}
            onLoaded={handleLoaded}
            step={step}
            onChangeStep={onChangeStep}
            onSubmit={onSubmit}
            isEmbedded={isEmbedded}
            verificationModelCacheRef={verificationModelCacheRef}
        />
    );

    const ownershipMethod = (
        <OwnershipMethod
            token={token}
            method={selectedMethod === 'ownership-sms' ? 'ownership-sms' : 'ownership-email'}
            onLoaded={handleLoaded}
            api={api}
            ownershipCacheRef={ownershipCacheRef}
            onSubmit={onSubmit}
            onClose={onClose}
            step={step}
            onChangeStep={onChangeStep}
            onError={onError}
        />
    );

    const tabs = [
        {
            method: 'captcha',
            title: c('Human verification method').t`CAPTCHA`,
            content: (
                <>
                    <Text>{c('Info').t`To fight spam and abuse, please verify you are human.`}</Text>
                    <Captcha theme={theme} token={token} onSubmit={(token) => onSubmit(token, 'captcha')} />
                </>
            ),
        } as const,
        {
            method: 'email',
            title: c('Human verification method').t`Email`,
            content: codeMethod,
        } as const,
        {
            method: 'sms',
            title: c('Human verification method').t`SMS`,
            content: codeMethod,
        } as const,
        {
            method: 'ownership-email',
            title: c('Human verification method').t`Email`,
            content: ownershipMethod,
        } as const,
        {
            method: 'ownership-sms',
            title: c('Human verification method').t`SMS`,
            content: ownershipMethod,
        } as const,
        {
            method: 'invite',
            title: c('Human verification method').t`Manual`,
            content: (
                <Text>
                    {c('Info')
                        .t`If you are having trouble creating your account, please request an invitation and we will respond within one business day.`}{' '}
                    <Href url="https://protonmail.com/support-form">{c('Link').t`Request an invite`}</Href>
                </Text>
            ),
        } as const,
    ].filter(({ method }) => availableMethods[method]);

    const tabIndex = tabs.findIndex((tab) => tab.method === selectedMethod);

    if (tabs.length === 0) {
        return (
            <Alert className="mb1" type="error">{c('Human verification method')
                .t`No verification method available`}</Alert>
        );
    }

    return (
        <>
            {step === HumanVerificationSteps.ENTER_DESTINATION && (
                <Tabs
                    fullWidth
                    tabs={tabs}
                    value={tabIndex}
                    onChange={(idx) => {
                        setSelectedMethod(tabs[idx].method);
                    }}
                />
            )}
            {step !== HumanVerificationSteps.ENTER_DESTINATION && [tabs[tabIndex].content]}
        </>
    );
};
export default HumanVerificationForm;
