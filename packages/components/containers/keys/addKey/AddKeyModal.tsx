import { useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { addAddressKeyAction } from '@proton/account/addressKeys/addAddressKeyAction';
import { addUserKeyAction } from '@proton/account/userKeys/addUserKeyAction';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { AlgorithmInfo } from '@proton/crypto';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { getAlgorithmExists } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import getPausedForwardingNotice from '../changePrimaryKeyForwardingNotice/getPausedForwardingNotice';
import SelectKeyGenType from './SelectKeyGenType';

interface Props extends ModalProps {
    target:
        | {
              type: 'user';
          }
        | {
              type: 'address';
              address: Address;
              /** for `type='address'` only */
              hasOutgoingE2EEForwardings?: boolean;
              /** relevant for `type='address'` only */
              emailAddress: string | undefined;
          };
    existingAlgorithms: AlgorithmInfo[];
}

enum Step {
    CONFIRMATION,
    SUCCESS,
    ERROR,
}
interface Model {
    step: Step;
}

const AddKeyModal = ({ existingAlgorithms, target, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [userSettings] = useUserSettings(); // loading state not needed since settings are prefetched in bootstrap
    const [keyGenType, setKeyGenType] = useState<KEYGEN_TYPES>(
        !!userSettings.Flags.SupportPgpV6Keys ? KEYGEN_TYPES.PQC : DEFAULT_KEYGEN_TYPE
    );
    const keyGenConfig = KEYGEN_CONFIGS[keyGenType];
    const [model, setModel] = useState<Model>({ step: Step.CONFIRMATION });
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const handleProcess = async () => {
        try {
            if (target.type === 'user') {
                await dispatch(addUserKeyAction({ keyGenConfig }));
                createNotification({ text: c('Key generation').t`Key successfully generated.` });
                return rest.onClose?.();
            } else if (target.type === 'address') {
                await dispatch(addAddressKeyAction({ keyGenConfig, address: target.address }));
                setModel({ step: Step.SUCCESS });
            }
        } catch (error) {
            handleError(error);
            // eslint-disable-next-line no-console
            console.error(error);
            setModel({ step: Step.ERROR });
        }
    };

    const exists = getAlgorithmExists(existingAlgorithms, keyGenConfig);
    const maybeExistsNotice = exists && (
        <div className="border border-weak rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4">
            <Icon name="exclamation-circle-filled" className="shrink-0 color-danger" />
            <p className="text-sm color-weak flex-1 pl-4 my-0">
                {getBoldFormattedText(
                    c('Key generation')
                        .t`You already have this key type. Unless that key has been compromised, generating **a new key may slow down your account**.`
                )}
            </p>
        </div>
    );

    return (
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader
                title={
                    model.step === Step.SUCCESS
                        ? c('Key generation').t`New key generated`
                        : c('Key generation').t`Generate key`
                }
            />
            <ModalTwoContent>
                <div>
                    {(() => {
                        if (target.type === 'user') {
                            return (
                                <>
                                    {model.step === Step.CONFIRMATION && (
                                        <>
                                            <div className="mb-2">
                                                {c('Key generation')
                                                    .t`This will generate a new key, which will be used to encrypt future contact details, email encryption keys, and other data.`}
                                            </div>
                                            {maybeExistsNotice}
                                        </>
                                    )}
                                    {/* {model.step === Step.SUCCESS && rest.onClose?.()} ; done in handleProcess */}
                                    {model.step === Step.ERROR && (
                                        <div>
                                            {c('Key generation').t`Key generation failed, please try again later.`}
                                        </div>
                                    )}
                                </>
                            );
                        }

                        const pausedForwardingNotice = getPausedForwardingNotice();
                        const emailAddress = target.type === 'address' ? target.emailAddress : '';

                        return (
                            <>
                                {model.step === Step.CONFIRMATION && (
                                    <>
                                        <div className="mb-2">
                                            {getBoldFormattedText(
                                                c('Key generation')
                                                    .t`This will generate a new key, which will be used to encrypt future emails and other data, for **${emailAddress}**.`
                                            )}
                                        </div>
                                        {!!userSettings.Flags.SupportPgpV6Keys && (
                                            <SelectKeyGenType
                                                keyGenType={keyGenType}
                                                setKeyGenType={setKeyGenType}
                                            ></SelectKeyGenType>
                                        )}
                                        {maybeExistsNotice}
                                        {target.type === 'address' && target.hasOutgoingE2EEForwardings && (
                                            <div className="border border-weak rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4">
                                                <Icon
                                                    name="exclamation-circle-filled"
                                                    className="shrink-0 color-warning"
                                                />
                                                <p className="text-sm color-weak flex-1 pl-4 my-0">
                                                    {pausedForwardingNotice}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {model.step === Step.SUCCESS && (
                                    <div>
                                        {c('Key generation')
                                            .t`If you generated this key because you suspect your previous key was compromised, please mark it as compromised in your settings.`}
                                    </div>
                                )}
                                {model.step === Step.ERROR && (
                                    <div>{c('Key generation').t`Key generation failed, please try again later.`}</div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {model.step === Step.CONFIRMATION && (
                    <>
                        <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                        <Button
                            color="norm"
                            loading={loading}
                            data-testid="generate-key"
                            onClick={() => {
                                void withLoading(handleProcess().catch(noop));
                            }}
                        >
                            {c('Key generation').t`Generate key`}
                        </Button>
                    </>
                )}
                {(model.step === Step.SUCCESS || model.step === Step.ERROR) && (
                    <Button onClick={rest.onClose} fullWidth={true}>
                        {c('pqc-optin: Action').t`Got it`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddKeyModal;
