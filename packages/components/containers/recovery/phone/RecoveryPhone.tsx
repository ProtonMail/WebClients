import { type FormEvent, type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PhoneInput from '@proton/components/components/v2/phone/LazyPhoneInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import clsx from '@proton/utils/clsx';

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
        <form className={clsx(['flex flex-wrap flex-column md:flex-row', className])} onSubmit={onSubmit}>
            <div
                className="mr-0 mb-4 md:mr-4 md:flex-1 min-w-custom"
                style={{ '--min-w-custom': inputWidth ?? '14em' }}
            >
                {input}
            </div>
            <div className="mb-2">
                <Button shape="outline" data-testid="account:recovery:phoneSubmit" {...submitButtonProps}>
                    {c('Action').t`Save`}
                </Button>
            </div>
        </form>
    );
};

interface Props {
    phoneData: {
        value: string;
        isVerified: boolean;
        hasReset: boolean;
    };
    defaultCountry?: string;
    className?: string;
    inputWidth?: string;
    autoFocus?: boolean;
    renderForm?: (props: RenderFormProps) => ReactNode;
    inputProps?: Partial<Pick<InputFieldProps<typeof PhoneInput>, 'label' | 'readOnly'>>;
    disableVerifyCta?: boolean;
    onSubmit: (input: string) => void;
    onVerify: () => void;
    loading: boolean;
}

const RecoveryPhone = ({
    renderForm = defaultRenderForm,
    phoneData,
    defaultCountry,
    className,
    inputWidth,
    autoFocus,
    inputProps,
    disableVerifyCta,
    onSubmit,
    onVerify,
    loading,
}: Props) => {
    const [input, setInput] = useState(phoneData.value);
    const { onFormSubmit } = useFormErrors();

    useEffect(() => {
        setInput(phoneData.value);
    }, [phoneData.value]);

    return (
        <>
            {renderForm({
                className,
                inputWidth,
                onSubmit: (e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    onSubmit(input);
                },
                onReset: () => setInput(phoneData.value),
                onVerify: () => onVerify(),
                onRemove: () => onSubmit(''),
                input: (
                    <InputFieldTwo
                        as={PhoneInput}
                        id="phoneInput"
                        disableChange={loading}
                        autoFocus={autoFocus}
                        defaultCountry={defaultCountry}
                        value={input}
                        onChange={setInput}
                        aria-label={c('label').t`Recovery phone number`}
                        assistiveText={
                            !disableVerifyCta &&
                            phoneData.value &&
                            (!phoneData.isVerified ? (
                                <>
                                    <IcExclamationCircleFilled className="color-danger shrink-0 aligntop mr-1" />
                                    <span className="color-norm mr-2">{c('Recovery Phone')
                                        .t`Phone number not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => onVerify()}
                                        aria-label={c('Recovery Phone')
                                            .t`Verify this recovery phone number now: ${phoneData.value}`}
                                    >
                                        {c('Recovery Phone').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <IcCheckmarkCircleFilled className="color-success shrink-0 aligntop mr-1" />
                                    <span className="mr-2">{c('Recovery Phone')
                                        .t`Phone number has been verified.`}</span>
                                </>
                            ))
                        }
                        {...inputProps}
                    />
                ),
                submitButtonProps: {
                    type: 'submit',
                    disabled: phoneData.value === input,
                    loading,
                },
            })}
        </>
    );
};

export default RecoveryPhone;
