import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import type { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

import { Tabs } from '../../../components';
import useApi from '../../../hooks/useApi';
import Captcha from './Captcha';
import CodeMethod from './CodeMethod';
import OwnershipMethod from './OwnershipMethod';
import Text from './Text';
import { getAvailableMethods } from './helper';
import type { CaptchaTheme, OwnershipCache, VerificationModel } from './interface';
import { HumanVerificationSteps } from './interface';

import './HumanVerificationModal.scss';

export interface HumanVerificationFormProps {
    onSubmit: (token: string, tokenType: HumanVerificationMethodType, verificationModel?: VerificationModel) => void;
    onClose: () => void;
    onLoaded?: (data: OwnershipCache) => void;
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
    verifyApp?: boolean;
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
    verifyApp,
}: HumanVerificationFormProps) => {
    const api = useApi();

    const availableMethods = getAvailableMethods(methods);
    const [selectedMethod, setSelectedMethod] = useState<SupportedHumanVerificationMethodType>(() => {
        const firstAvailableMethod = Object.entries(availableMethods).find(([, available]) => available)?.[0] as
            | SupportedHumanVerificationMethodType
            | undefined;
        return firstAvailableMethod || 'captcha';
    });

    const ownershipCacheRef = useRef<OwnershipCache>({ 'ownership-sms': {}, 'ownership-email': {} });
    const verificationModelCacheRef = useRef<VerificationModel | undefined>(undefined);
    const loadedOnceRef = useRef(false);
    const handleLoaded = () => {
        if (loadedOnceRef.current) {
            return;
        }
        onLoaded?.(ownershipCacheRef.current);
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
            verifyApp={verifyApp}
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
                    <Href href={getStaticURL('/support')}>{c('Link').t`Request an invite`}</Href>
                </Text>
            ),
        } as const,
    ].filter(({ method }) => availableMethods[method]);

    const tabIndex = tabs.findIndex((tab) => tab.method === selectedMethod);

    if (tabs.length === 0) {
        return (
            <Alert className="mb-4" type="error">{c('Human verification method')
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
