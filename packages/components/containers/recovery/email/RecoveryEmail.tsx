import { type FormEvent, type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { Input } from '@proton/atoms/Input/Input';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { InputFieldProps } from '../../../components/v2/field/InputField';

interface RenderFormProps {
    className?: string;
    inputWidth?: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onReset: () => void;
    input: ReactNode;
    submitButtonProps: {
        type: 'submit';
        disabled: boolean;
        loading: boolean;
    };
    onVerify: () => void;
    onRemove: () => void;
}

const defaultRenderForm = ({ className, inputWidth, onSubmit, input, submitButtonProps }: RenderFormProps) => {
    return (
        <form className={clsx('flex flex-wrap flex-column md:flex-row', className)} onSubmit={onSubmit}>
            <div
                className="mr-0 mb-4 md:mr-4 md:flex-1 min-w-custom"
                style={{ '--min-w-custom': inputWidth ?? '14rem' }}
            >
                {input}
            </div>
            <div className="mb-2">
                <Button shape="outline" data-testid="account:recovery:emailSubmit" {...submitButtonProps}>
                    {c('Action').t`Save`}
                </Button>
            </div>
        </form>
    );
};

interface Props {
    emailData: {
        value: string;
        status: SETTINGS_STATUS;
        hasReset: boolean;
        hasNotify: boolean;
    };
    className?: string;
    inputWidth?: string;
    onSuccess?: (data: { emailEnabled: boolean; updatedUserSettings: UserSettings }) => void;
    autoFocus?: boolean;
    renderForm?: (props: RenderFormProps) => ReactNode;
    inputProps?: Partial<Pick<InputFieldProps<typeof Input>, 'label' | 'readOnly' | 'placeholder'>>;
    disableVerifyCta?: boolean;
    onSubmit: (input: string) => void;
    onVerify: () => void;
    loading: boolean;
}

const RecoveryEmail = ({
    renderForm = defaultRenderForm,
    emailData,
    className,
    inputWidth,
    autoFocus,
    inputProps,
    disableVerifyCta,
    onSubmit,
    onVerify,
    loading,
}: Props) => {
    const [input, setInput] = useState(emailData.value);
    const { validator, onFormSubmit } = useFormErrors();

    useEffect(() => {
        setInput(emailData.value);
    }, [emailData.value]);

    return (
        <>
            {renderForm({
                className,
                inputWidth,
                onVerify: () => onVerify(),
                onRemove: () => onSubmit(''),
                onReset: () => setInput(emailData.value),
                onSubmit: (e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    onSubmit(input);
                },
                input: (
                    <InputFieldTwo
                        type="email"
                        autoComplete="email"
                        title={emailData.value}
                        autoFocus={autoFocus}
                        id="recovery-email-input"
                        disableChange={loading}
                        value={input || ''}
                        error={validator([input && emailValidator(input)].filter(isTruthy))}
                        onValue={setInput}
                        assistiveText={
                            !disableVerifyCta &&
                            emailData.value &&
                            (emailData.status !== SETTINGS_STATUS.VERIFIED ? (
                                <>
                                    <IcExclamationCircleFilled className="color-danger shrink-0 aligntop mr-1" />
                                    <span className="color-norm mr-2">{c('Recovery Email')
                                        .t`Email address not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => onVerify()}
                                        aria-label={c('Recovery Email')
                                            .t`Verify now this recovery email address: ${emailData.value}`}
                                    >
                                        {c('Recovery Email').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <IcCheckmarkCircleFilled className="color-success shrink-0 aligntop mr-1" />
                                    <span className="mr-2">{c('Recovery Email')
                                        .t`Email address has been verified.`}</span>
                                </>
                            ))
                        }
                        {...inputProps}
                    />
                ),
                submitButtonProps: {
                    type: 'submit',

                    disabled: emailData.value === input,
                    loading,
                },
            })}
        </>
    );
};

export default RecoveryEmail;
