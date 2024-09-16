import { useRef, useState } from 'react';

import { c } from 'ttag';

import { UnlockModal, useModalState } from '@proton/components';
import type { AddressGeneration } from '@proton/components/containers/login/interface';
import { useErrorHandler } from '@proton/components/hooks';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';
import type { AddressGenerationPayload } from '@proton/shared/lib/keys';
import { ClaimableAddressType } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Text from '../public/Text';
import ClaimInternalAddressForm from './ClaimInternalAddressForm';
import GenerateAddressform from './GenerateAddressform';

interface Props {
    onBack?: () => void;
    onSubmit: (payload: Omit<AddressGenerationPayload, 'preAuthKTVerify'>) => Promise<void>;
    toAppName: string;
    api: Api;
    data: AddressGeneration;
}

const GenerateAddressStep = ({
    onBack,
    onSubmit,
    toAppName,
    api,
    data: { externalEmailAddress: externalEmailAddressValue, claimableAddress, availableDomains, setup },
}: Props) => {
    const payloadRef = useRef<{ username: string; domain: string; address: string } | null>(null);
    const errorHandler = useErrorHandler();
    const [step, setStep] = useState<0 | 1>(0);
    const payload = payloadRef.current;
    const [unlockModalProps, setUnlockModalOpen, renderUnlockModal] = useModalState();
    const externalEmailAddress = externalEmailAddressValue?.Email ? (
        <strong key="bold">{externalEmailAddressValue?.Email}</strong>
    ) : (
        ''
    );

    const handleSubmit = async (username: string, domain: string) => {
        if (claimableAddress?.type !== ClaimableAddressType.Fixed) {
            try {
                await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
            } catch (e) {
                errorHandler(e);
                return;
            }
        }

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
                <Text data-testid="text:generate-internal-address">
                    {externalEmailAddress && [
                        c('Info').jt`Your ${BRAND_NAME} Account is associated with ${externalEmailAddress}.`,
                        ' ',
                    ]}
                    {c('Info').jt`To use ${toAppName}, you need a ${MAIL_APP_NAME} address.`}
                </Text>
                {!claimableAddress || step === 1 ? (
                    <GenerateAddressform
                        onSubmit={handleSubmit}
                        defaultUsername={payload?.username}
                        availableDomains={availableDomains}
                    />
                ) : (
                    <ClaimInternalAddressForm
                        onSubmit={handleSubmit}
                        domain={claimableAddress.domain}
                        username={claimableAddress.username}
                        onEdit={
                            claimableAddress.type === ClaimableAddressType.Any
                                ? () => {
                                      setStep(1);
                                  }
                                : undefined
                        }
                    />
                )}
            </Content>
        </>
    );
};

export default GenerateAddressStep;
