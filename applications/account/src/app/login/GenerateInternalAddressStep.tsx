import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useModalState } from '@proton/components/components';
import { UnlockModal } from '@proton/components/containers';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { InternalAddressGenerationPayload, InternalAddressGenerationSetup } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Text from '../public/Text';
import GenerateInternalAddressConfirmForm from './GenerateInternalAddressConfirmForm';
import GenerateInternalAddressForm from './GenerateInternalAddressForm';

interface Props {
    externalEmailAddress?: string;
    onBack?: () => void;
    onSubmit: (payload: InternalAddressGenerationPayload) => Promise<void>;
    toAppName: string;
    availableDomains: string[];
    api: Api;
    setup: InternalAddressGenerationSetup;
}

const GenerateInternalAddressStep = ({
    externalEmailAddress: externalEmailAddressValue,
    onBack,
    onSubmit,
    toAppName,
    availableDomains,
    api,
    setup,
}: Props) => {
    const payloadRef = useRef<{ username: string; domain: string; address: string } | null>(null);
    const [step, setStep] = useState<0 | 1>(0);
    const payload = payloadRef.current;
    const [unlockModalProps, setUnlockModalOpen] = useModalState();
    const externalEmailAddress = externalEmailAddressValue ? (
        <strong key="bold">{externalEmailAddressValue}</strong>
    ) : (
        ''
    );
    return (
        <>
            {step === 0 && (
                <>
                    <Header title={c('Title').t`Create a ${MAIL_APP_NAME} address`} onBack={onBack} />
                    <Content>
                        <Text>
                            {c('Info')
                                .jt`Your ${BRAND_NAME} Account is associated with ${externalEmailAddress}. To use ${toAppName}, you need a ${MAIL_APP_NAME} address.`}
                        </Text>
                        <GenerateInternalAddressForm
                            api={api}
                            defaultUsername={payload?.username}
                            availableDomains={availableDomains}
                            onSubmit={(username, domain) => {
                                payloadRef.current = {
                                    username,
                                    domain,
                                    address: `${username}@${domain}`,
                                };
                                setStep(1);
                            }}
                        />
                    </Content>
                </>
            )}
            {step === 1 && payload && (
                <>
                    <UnlockModal
                        {...unlockModalProps}
                        onSuccess={async (password) => {
                            return onSubmit({
                                ...payload,
                                setup: {
                                    mode: 'setup',
                                    loginPassword: password,
                                },
                            }).catch(noop);
                        }}
                    />
                    <Header
                        title={c('Title').t`Your ${MAIL_APP_NAME} address`}
                        onBack={() => {
                            setStep(0);
                        }}
                    />
                    <Content>
                        <GenerateInternalAddressConfirmForm
                            address={payload.address}
                            recoveryAddress={externalEmailAddressValue}
                            onSubmit={async () => {
                                if (setup.mode === 'ask') {
                                    setUnlockModalOpen(true);
                                    return;
                                }
                                return onSubmit({
                                    ...payload,
                                    setup,
                                });
                            }}
                        />
                    </Content>
                </>
            )}
        </>
    );
};

export default GenerateInternalAddressStep;
