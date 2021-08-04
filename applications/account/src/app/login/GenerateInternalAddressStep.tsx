import { useRef, useState } from 'react';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Address, Api } from '@proton/shared/lib/interfaces';

import Header from '../public/Header';
import BackButton from '../public/BackButton';
import Content from '../public/Content';
import GenerateInternalAddressForm from './GenerateInternalAddressForm';
import GenerateInternalAddressConfirmForm from './GenerateInternalAddressConfirmForm';

interface InternalAddressGenerationPayload {
    username: string;
    domain: string;
    address: string;
}

export interface InternalAddressGeneration {
    externalEmailAddress: Address;
    availableDomains: string[];
    api: Api;
    onDone: () => Promise<void>;
    revoke: () => void;
    keyPassword: string;
    payload?: InternalAddressGenerationPayload;
}

interface Props {
    externalEmailAddress: string;
    onBack: () => void;
    onSubmit: (payload: InternalAddressGenerationPayload) => Promise<void>;
    mailAppName: string;
    toAppName: string;
    availableDomains: string[];
    api: Api;
}

const GenerateInternalAddressStep = ({
    externalEmailAddress,
    onBack,
    onSubmit,
    mailAppName,
    toAppName,
    availableDomains,
    api,
}: Props) => {
    const payloadRef = useRef<InternalAddressGenerationPayload | null>(null);
    const [step, setStep] = useState<0 | 1>(0);
    const payload = payloadRef.current;
    return (
        <>
            {step === 0 && (
                <>
                    <Header
                        title={c('Title').t`Create a ${mailAppName} address`}
                        left={<BackButton onClick={onBack} />}
                    />
                    <Content>
                        <div className="mb1-75">
                            {c('Info')
                                .t`Your ${BRAND_NAME} Account is associated with ${externalEmailAddress}. To use ${toAppName}, please create an address.`}
                        </div>
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
                    <Header
                        title={c('Title').t`Address is available`}
                        left={<BackButton onClick={() => setStep(0)} />}
                    />
                    <Content>
                        <GenerateInternalAddressConfirmForm
                            address={payload.address}
                            recoveryAddress={externalEmailAddress}
                            onSubmit={() => onSubmit(payload)}
                        />
                    </Content>
                </>
            )}
        </>
    );
};

export default GenerateInternalAddressStep;
