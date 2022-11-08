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
import ClaimInternalAddressForm from './ClaimInternalAddressForm';
import GenerateInternalAddressForm from './GenerateInternalAddressForm';

interface Props {
    externalEmailAddress?: string;
    claimableAddress?: { username: string; domain: string };
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
    claimableAddress,
    api,
    setup,
}: Props) => {
    const payloadRef = useRef<{ username: string; domain: string; address: string } | null>(null);
    const [step, setStep] = useState<0 | 1>(0);
    const payload = payloadRef.current;
    const [unlockModalProps, setUnlockModalOpen, renderUnlockModal] = useModalState();
    const externalEmailAddress = externalEmailAddressValue ? (
        <strong key="bold">{externalEmailAddressValue}</strong>
    ) : (
        ''
    );

    const handleSubmit = async (username: string, domain: string) => {
        const payload = {
            username,
            domain,
            address: `${username}@${domain}`,
        };
        payloadRef.current = payload;

        if (setup.mode === 'ask') {
            setUnlockModalOpen(true);
            return;
        }

        return onSubmit({
            ...payload,
            setup,
        });
    };

    return (
        <>
            {renderUnlockModal && payload && (
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
            )}
            <Header
                title={c('Title').t`Create your ${BRAND_NAME} address`}
                onBack={() => {
                    if (step === 1 && claimableAddress) {
                        return setStep(0);
                    }
                    return onBack?.();
                }}
            />
            <Content>
                <Text>
                    {c('Info')
                        .jt`Your ${BRAND_NAME} Account is associated with ${externalEmailAddress}. To use ${toAppName}, you need a ${MAIL_APP_NAME} address.`}
                </Text>
                {!claimableAddress || step === 1 ? (
                    <GenerateInternalAddressForm
                        api={api}
                        defaultUsername={payload?.username}
                        availableDomains={availableDomains}
                        onSubmit={handleSubmit}
                    />
                ) : (
                    <ClaimInternalAddressForm
                        onSubmit={() => {
                            return handleSubmit(claimableAddress.username, claimableAddress.domain);
                        }}
                        domain={claimableAddress.domain}
                        username={claimableAddress.username}
                        api={api}
                        onEdit={() => {
                            setStep(1);
                        }}
                    />
                )}
            </Content>
        </>
    );
};

export default GenerateInternalAddressStep;
