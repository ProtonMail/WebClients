import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import {
    Copy,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    useFormErrors,
    useModalState,
} from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getContinueToString } from '../public/helper';
import type { Background } from './Layout';
import Layout from './Layout';
import type { Measure } from './interface';

const CopyPasswordModal = ({
    password,
    onConfirm,
    onEdit,
    children,
    isB2bPlan,
    ...rest
}: ModalProps & {
    password: string;
    onEdit: () => void;
    onConfirm: () => void;
    children: ReactNode;
    isB2bPlan: boolean;
}) => {
    useEffect(() => {
        metrics.core_vpn_single_signup_passwordSelection_step_2_total.increment({
            step: 'copy_password_modal',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, []);

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader title={c('Info').t`Your ${BRAND_NAME} password`} />
            <ModalTwoContent>
                {children}
                <div>{c('Info').t`Be sure to copy your password and store it somewhere safe.`}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    onClick={() => {
                        onEdit();
                        rest?.onClose?.();
                    }}
                >{c('Action').t`Edit password`}</Button>
                <Button color="norm" onClick={onConfirm}>{c('Action').t`Confirm`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

const GeneratedPasswordDisplay = ({
    password,
    measure,
    setCopied,
    className,
}: {
    password: string;
    measure: Measure;
    setCopied: (copied: boolean) => void;
    className?: string;
}) => {
    const { createNotification } = useNotifications();

    return (
        <div className={clsx('pl-4 py-1 bg-weak rounded flex justify-space-between items-center', className)}>
            <div
                className="user-select text-pre-wrap break"
                onCopy={() => {
                    setCopied(true);
                }}
            >
                {password}
            </div>
            <Copy
                tooltipText={c('Info').t`Copy the suggested password to clipboard`}
                shape="ghost"
                value={password}
                onCopy={() => {
                    void measure({
                        event: TelemetryAccountSignupEvents.interactPassword,
                        dimensions: { click: 'copy' },
                    });
                    setCopied(true);
                    createNotification({ text: c('Info').t`Password copied to clipboard` });
                }}
            />
        </div>
    );
};

const Step3 = ({
    onComplete,
    password,
    email,
    measure,
    isB2bPlan,
    background,
    product,
}: {
    password: string;
    email: string;
    onComplete: (newPassword: string | undefined) => Promise<void>;
    measure: Measure;
    isB2bPlan: boolean;
    background?: Background;
    product: string;
}) => {
    const [setOwnPasswordMode, setSetOwnPasswordMode] = useState(false);
    const [copyModalProps, setCopyModal, renderCopyModal] = useModalState();

    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const { validator, onFormSubmit, reset } = useFormErrors();

    useEffect(() => {
        void measure({ event: TelemetryAccountSignupEvents.onboardingStart, dimensions: {} });
    }, []);

    useEffect(() => {
        metrics.core_vpn_single_signup_pageLoad_2_total.increment({
            step: 'password_selection',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, []);

    useEffect(() => {
        if (setOwnPasswordMode) {
            metrics.core_vpn_single_signup_passwordSelection_step_2_total.increment({
                step: 'own_password',
                flow: isB2bPlan ? 'b2b' : 'b2c',
            });
            return;
        }

        metrics.core_vpn_single_signup_passwordSelection_step_2_total.increment({
            step: 'given_password',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, [setOwnPasswordMode]);

    const finalPassword = setOwnPasswordMode ? newPassword : undefined;
    const onBack = setOwnPasswordMode
        ? () => {
              if (loading) {
                  return;
              }
              setSetOwnPasswordMode(false);
          }
        : undefined;

    return (
        <Layout hasDecoration={false} onBack={onBack} isB2bPlan={isB2bPlan} background={background}>
            <Main>
                <Header
                    title={c('Title').t`Set your password`}
                    subTitle={getContinueToString(product)}
                    onBack={onBack}
                />
                <Content>
                    <div className="flex gap-2 mb-6">
                        <Avatar color="weak">{getInitials(email)}</Avatar>
                        <div className="flex text-ellipsis items-center justify-center">{email}</div>
                    </div>
                    <form
                        name="setPasswordForm"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (loading || !onFormSubmit()) {
                                return;
                            }

                            if (!setOwnPasswordMode) {
                                void measure({
                                    event: TelemetryAccountSignupEvents.interactPassword,
                                    dimensions: { click: 'continue_suggested' },
                                });
                            } else {
                                void measure({
                                    event: TelemetryAccountSignupEvents.interactPassword,
                                    dimensions: { click: 'continue_custom' },
                                });
                            }

                            if (!copied && !setOwnPasswordMode) {
                                setCopyModal(true);
                            } else {
                                withLoading(onComplete(finalPassword)).catch(noop);
                            }
                        }}
                        method="post"
                    >
                        {!setOwnPasswordMode ? (
                            <>
                                <GeneratedPasswordDisplay password={password} setCopied={setCopied} measure={measure} />
                                <div className="mt-1 mb-4 color-weak text-sm">
                                    {c('Info').t`We generated a strong password for you`}
                                </div>
                            </>
                        ) : (
                            <>
                                <InputFieldTwo
                                    as={PasswordInputTwo}
                                    id="password"
                                    bigger
                                    label={c('Label').t`Password`}
                                    assistiveText={getMinPasswordLengthMessage()}
                                    error={validator([passwordLengthValidator(newPassword)])}
                                    disableChange={loading}
                                    autoFocus
                                    value={newPassword}
                                    onValue={setNewPassword}
                                />
                                <InputFieldTwo
                                    as={PasswordInputTwo}
                                    id="password-repeat"
                                    bigger
                                    label={c('Label').t`Confirm password`}
                                    error={validator([
                                        passwordLengthValidator(confirmNewPassword),
                                        confirmPasswordValidator(confirmNewPassword, newPassword),
                                    ])}
                                    disableChange={loading}
                                    value={confirmNewPassword}
                                    onValue={setConfirmNewPassword}
                                    rootClassName="mt-2"
                                />
                            </>
                        )}
                        <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-5">
                            {setOwnPasswordMode
                                ? c('Action').t`Set new password`
                                : c('Action').t`Continue with this password`}
                        </Button>
                        {!setOwnPasswordMode && (
                            <Button
                                size="large"
                                color="norm"
                                shape="ghost"
                                type="submit"
                                fullWidth
                                loading={loading}
                                className="mt-2"
                                onClick={() => {
                                    void measure({
                                        event: TelemetryAccountSignupEvents.interactPassword,
                                        dimensions: { click: 'set_custom' },
                                    });
                                    setSetOwnPasswordMode(true);
                                    reset();
                                }}
                            >
                                {c('Action').t`Choose my own password`}
                            </Button>
                        )}
                    </form>
                </Content>
            </Main>
            {renderCopyModal && (
                <CopyPasswordModal
                    {...copyModalProps}
                    children={
                        <GeneratedPasswordDisplay
                            className="mb-4"
                            password={password}
                            setCopied={setCopied}
                            measure={measure}
                        />
                    }
                    onEdit={() => {
                        setSetOwnPasswordMode(true);
                        reset();
                    }}
                    onConfirm={() => onComplete(finalPassword).catch(noop)}
                    password={password}
                    isB2bPlan={isB2bPlan}
                />
            )}
        </Layout>
    );
};

export default Step3;
