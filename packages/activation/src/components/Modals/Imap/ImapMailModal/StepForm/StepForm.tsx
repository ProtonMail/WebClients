import { c } from 'ttag';

import { EASY_SWITCH_EMAIL_PLACEHOLDER } from '@proton/activation/src/constants';
import { IMPORT_ERROR, ImportProvider } from '@proton/activation/src/interface';
import {
    selectImapDraftMailImportApiErrorCode,
    selectImapDraftMailImportStep,
    selectImapDraftProvider,
} from '@proton/activation/src/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button, Input } from '@proton/atoms';
import {
    Field,
    Form,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    PrimaryButton,
    Row,
} from '@proton/components';

import ProviderWrapper from '../ProviderWrapper';
import StepFormError from './StepFormError';
import useStepForm from './hooks/useStepForm';

function StepForm() {
    const isReconnectStep = useEasySwitchSelector(selectImapDraftMailImportStep) === 'reconnect-form';
    const importProvider = useEasySwitchSelector(selectImapDraftProvider);
    const apiErrorCode = useEasySwitchSelector(selectImapDraftMailImportApiErrorCode);
    const {
        blurred,
        hasErrors,
        errors,
        formValues,
        setBlurred,
        setFormValues,
        handleCancel,
        handleSubmit,
        isConnectingToProvider,
    } = useStepForm();

    return (
        <ModalTwo onClose={handleCancel} size="xlarge" open as={Form} onSubmit={handleSubmit}>
            <ModalTwoHeader
                title={isReconnectStep ? c('Title').t`Reconnect your account` : c('Title').t`Start a new import`}
            />
            <ModalTwoContent>
                <ProviderWrapper isConnectingToProvider={isConnectingToProvider}>
                    <StepFormError isReconnect={isReconnectStep} errorCode={apiErrorCode} />
                    <div className="mb-8">
                        {c('Info').t`Enter the credentials of the email account you want to import from.`}
                        <br />
                        {c('Info').t`Your login information will not be saved after the import is completed.`}
                    </div>
                    <Row>
                        <Label htmlFor="emailAddress">{c('Label').t`Email`}</Label>
                        <Field>
                            <Input
                                id="emailAddress"
                                value={formValues.emailAddress}
                                onChange={({ target }) => {
                                    setFormValues({ ...formValues, emailAddress: target.value });
                                }}
                                onBlur={() => setBlurred({ ...blurred, emailAddress: true })}
                                autoFocus
                                required
                                disabled={isReconnectStep}
                                error={errors?.emailAddress}
                                placeholder={importProvider ? EASY_SWITCH_EMAIL_PLACEHOLDER[importProvider] : undefined}
                                data-testid="StepForm:emailInput"
                            />
                            {errors?.emailAddress && <div className="text-sm color-danger">{errors?.emailAddress}</div>}
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="password">
                            {importProvider === ImportProvider.YAHOO
                                ? c('Label').t`App password`
                                : c('Label').t`Password`}
                        </Label>
                        <Field>
                            <PasswordInputTwo
                                id="password"
                                value={formValues.password}
                                onChange={({ target }) => {
                                    setFormValues({ ...formValues, password: target.value });
                                }}
                                onBlur={() => setBlurred({ ...blurred, password: true })}
                                required
                                error={errors?.password}
                                data-testid="StepForm:passwordInput"
                            />
                            {errors?.password && <div className="text-sm color-danger">{errors?.password}</div>}
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="imap">{c('Label').t`Mail Server (IMAP)`}</Label>
                        <Field>
                            <Input
                                id="imap"
                                placeholder="imap.domain.com"
                                value={formValues.imap}
                                onChange={({ target }) => {
                                    setFormValues({ ...formValues, imap: target.value });
                                }}
                                onBlur={() => setBlurred({ ...blurred, imap: true })}
                                required
                                error={errors?.imap}
                                data-testid="StepForm:serverInput"
                            />
                            {errors?.imap && <div className="text-sm color-danger">{errors?.imap}</div>}
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="port">{c('Label').t`Port`}</Label>
                        <Field>
                            <Input
                                id="port"
                                placeholder="993"
                                value={formValues.port}
                                onChange={({ target }) => setFormValues({ ...formValues, port: target.value })}
                                onBlur={() => setBlurred({ ...blurred, port: true })}
                                required
                                error={errors?.port}
                                data-testid="StepForm:portInput"
                            />
                            {errors?.port && <div className="text-sm color-danger">{errors?.port}</div>}
                        </Field>
                    </Row>
                    {apiErrorCode === IMPORT_ERROR.IMAP_CONNECTION_ERROR && (
                        <>
                            <p className="text-bold mb-3">{c('Warning').t`Skip verification?`}</p>
                            {/* translator: users with self hosted certificate can skip server validation if we're not able to verify the certificate ourselves */}
                            <p className="my-2">{c('Warning')
                                .t`We couldn't verify the mail server. If you trust it, you can skip this verification.`}</p>
                        </>
                    )}
                </ProviderWrapper>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="outline" onClick={handleCancel} data-testid="StepForm:cancelButton">
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton
                    type="submit"
                    disabled={hasErrors}
                    loading={isConnectingToProvider}
                    data-testid="StepForm:submitButton"
                >
                    {(() => {
                        if (isReconnectStep) {
                            return c('Action').t`Reconnect`;
                        }
                        if (apiErrorCode === IMPORT_ERROR.IMAP_CONNECTION_ERROR) {
                            return c('Action').t`Skip verification`;
                        }
                        return c('Action').t`Next`;
                    })()}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export default StepForm;
