import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { AlgorithmInfo } from '@proton/crypto';
import useLoading from '@proton/hooks/useLoading';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import type { KeyGenConfig } from '@proton/shared/lib/interfaces';
import { getAlgorithmExists } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import useNotifications from '../../../hooks/useNotifications';

interface Props extends ModalProps {
    type: 'user' | 'address';
    existingAlgorithms: AlgorithmInfo[];
    onAdd: (config: KeyGenConfig) => Promise<string>;
}

const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];

const AddKeyModal = ({ existingAlgorithms, type, onAdd, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const handleProcess = async () => {
        try {
            await onAdd(keyGenConfig);
            createNotification({ text: c('Key generation').t`Key successfully generated.` });
            rest.onClose?.();
        } catch (error) {
            console.error(error);
            createNotification({
                text: c('Key generation').t`Generating key failed. Please try again later.`,
                type: 'error',
            });
            rest.onClose?.();
        }
    };

    const exists = getAlgorithmExists(existingAlgorithms, keyGenConfig);

    return (
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader title={c('Key generation').t`Generate key`} />
            <ModalTwoContent>
                <div>
                    {(() => {
                        if (type === 'user') {
                            return (
                                <>
                                    <div className="mb-2">
                                        {c('Key generation')
                                            .t`This will generate a new key, which will be used to encrypt future contact details, email encryption keys, and other data.`}
                                    </div>
                                    {exists && (
                                        <div className="text-bold">{c('Key generation')
                                            .t`Note: you already have a key with the same algorithm for this user. Unless that key has been compromised, it may be unnecessary to generate a new key, and doing so may slow down your account.`}</div>
                                    )}
                                </>
                            );
                        }

                        return (
                            <>
                                <div className="mb-2">
                                    {c('Key generation')
                                        .t`This will generate a new key, which will be used to encrypt future emails, among other data.`}
                                </div>
                                <div className="mb-2">
                                    {c('Key generation')
                                        .t`If you're generating a new key because you believe your existing key has been compromised, please mark it as compromised after generating this key.`}
                                </div>
                                {exists && (
                                    <div className="text-bold">
                                        {c('Key generation')
                                            .t`Note: you already have a key with the same algorithm for this address. Unless that key has been compromised, it may be unnecessary to generate a new key, and doing so may slow down your account.`}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    loading={loading}
                    data-testid="generate-key"
                    onClick={() => {
                        withLoading(handleProcess().catch(noop));
                    }}
                >
                    {c('Key generation').t`Generate key`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddKeyModal;
