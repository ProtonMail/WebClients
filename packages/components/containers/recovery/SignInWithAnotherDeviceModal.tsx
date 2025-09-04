import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { deserializeQrCodePayload } from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import { signInWithAnotherDevicePush } from '@proton/account/signInWithAnotherDevice/signInWithAnotherDevicePush';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import Modal, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputField from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import metrics from '@proton/metrics';
import observeApiError from '@proton/metrics/lib/observeApiError';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

interface Props extends ModalProps<'form'> {}

const SignInWithAnotherDeviceModal = (props: Props) => {
    const [qrCodeData, setQrCodeData] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit, reset } = useFormErrors();
    const api = useApi();
    const handleError = useErrorHandler();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const [step, setStep] = useState<'warning' | 'code'>('warning');

    useEffect(() => {
        metrics.core_edm_push_total.increment({ status: 'init' });
    }, []);

    const handleSubmit = async () => {
        try {
            await signInWithAnotherDevicePush({
                api: getSilentApi(api),
                qrCodePayload: deserializeQrCodePayload(qrCodeData),
                keyPassword: authentication.getPassword(),
            });
            createNotification({ text: c('edm').t`You have successfully signed in to another device` });
            metrics.core_edm_push_total.increment({ status: 'success' });
            props.onClose?.();
        } catch (e) {
            observeApiError(e, (status) => metrics.core_edm_push_total.increment({ status }));
            throw e;
        }
    };

    const domain = 'proton.me';
    const email = user.Email || user.Name || '';

    return (
        <Modal
            as={Form}
            onSubmit={(e) => {
                if (step === 'warning') {
                    setStep('code');
                    reset();
                } else if (step === 'code') {
                    if (!onFormSubmit(e.currentTarget)) {
                        return;
                    }
                    withLoading(handleSubmit()).catch(handleError);
                }
            }}
            size="small"
            {...props}
        >
            <ModalHeader title={c('edm').t`Sign in on another device`} />
            <ModalContent>
                {step === 'warning' && (
                    <>
                        <div className="mb-4">
                            {getBoldFormattedText(
                                c('edm')
                                    .t`**How it works:** Enter in this device the code displayed on the device you want to sign in to. You will be signed in as **${email}**. Both devices will stay active.`
                            )}
                        </div>
                        <div className="p-3 border border-weak rounded">
                            <div className="flex gap-2 flex-nowrap items-center">
                                <div className="shrink-0">
                                    <Icon name="lightbulb" />
                                </div>
                                <div className="flex-1 text-bold">{c('edm').t`Security tips`}</div>
                            </div>
                            <ul className="my-2">
                                <li className="mb-2">
                                    {c('edm')
                                        .t`Be cautious of messages with QR codes. Only scan a code if you trust the source.`}
                                </li>
                                <li className="mb-2">
                                    {c('edm')
                                        .t`${BRAND_NAME} will never contact you unexpectedly asking you to sign in with a QR code.`}
                                </li>
                                <li className="mb-2">
                                    {c('edm')
                                        .t`${BRAND_NAME} will never ask you to scan a QR code that’s not from ${domain} or an official ${BRAND_NAME} app.`}
                                </li>
                            </ul>
                        </div>
                    </>
                )}
                {step === 'code' && (
                    <div>
                        <div className="mb-4">
                            {getBoldFormattedText(
                                c('edm')
                                    .t`To access the code of the device you want to sign in to, tap the **Sign in with QR code** button in the help menu of the sign-in screen, and then tap **Enter key manually**. `
                            )}
                        </div>
                        <InputField
                            className="text-monospace"
                            id="qrcode"
                            autoFocus
                            label={c('edm').t`Enter code manually`}
                            error={validator([requiredValidator(qrCodeData)])}
                            disableChange={loading}
                            value={qrCodeData}
                            onValue={setQrCodeData}
                            assistiveText={c('edm').t`Code from the other device`}
                        />
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                {step === 'warning' && (
                    <Button onClick={props.onClose} disabled={loading}>
                        {c('Action').t`Cancel`}
                    </Button>
                )}
                {step === 'code' && (
                    <Button onClick={() => setStep('warning')} disabled={loading}>
                        {c('Action').t`Back`}
                    </Button>
                )}
                <Button loading={loading} type="submit" color="norm" data-testid="edm:sign-in">
                    {step === 'warning' ? c('Action').t`Continue` : c('Action').t`Sign in`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SignInWithAnotherDeviceModal;
