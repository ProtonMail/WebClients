import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Input } from '@proton/atoms/Input';
import {
    Form,
    Icon,
    IconName,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
    TextAreaTwo,
} from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import type { AliasMailbox, AliasOptions } from '@proton/pass/types';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import passAliasesLogo from '@proton/styles/assets/img/illustrations/pass-aliases-logo.svg';
import clsx from '@proton/utils/clsx';

import { usePassAliasesContext } from '../../PassAliasesProvider';
import { CreateModalFormState } from '../../interface';
import useCreateModalForm from './useCreatePassAliasesForm';

import './CreatePassAliasesForm.scss';

interface Props {
    onSubmit: () => void;
    modalProps: ModalProps;
}

const FormGroupFieldWrapper = ({ children, classname }: { children: React.ReactNode; classname?: string }) => (
    <div className={clsx('stacked-field-group', classname)}>{children}</div>
);

const FormFieldWrapper = ({
    children,
    icon,
    hasError,
    isBigger,
    isGroupElement,
    classname,
}: {
    children: React.ReactNode;
    icon?: IconName;
    hasError?: boolean;
    isBigger?: boolean;
    isGroupElement?: boolean;
    classname?: string;
}) => (
    <div
        className={clsx(
            'relative stacked-field border-weak px-4 py-3 flex items-center gap-x-4',
            hasError && 'stacked-field--errors',
            isBigger && 'stacked-field--bigger-field',
            isGroupElement ? 'border-top border-left border-right' : 'border rounded-lg',
            classname
        )}
    >
        {icon && <Icon name={icon} className="shrink-0" />}
        <div className="flex-1">{children}</div>
    </div>
);

const CreatePassAliasesForm = ({ modalProps, onSubmit }: Props) => {
    const { formValues, setFormValues, blurred, setBlurred, hasErrors, errors, submitted, setSubmitted } =
        useCreateModalForm();
    const { submitNewAlias, getAliasOptions } = usePassAliasesContext();
    const { createNotification } = useNotifications();
    const [mailboxes, setMailboxes] = useState<AliasOptions['mailboxes']>([]);
    const [aliasSuffix, setAliasSuffix] = useState<string>();
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
    const isMounted = useIsMounted();

    const getFieldError = (field: keyof CreateModalFormState) => {
        if (!submitted || !errors) {
            return undefined;
        }
        return errors[field];
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (hasErrors) {
            return;
        }

        setLoadingSubmit(true);

        await submitNewAlias(formValues);

        if (isMounted()) {
            setLoadingSubmit(false);
            onSubmit();
        }
    };

    useEffect(() => {
        const initForm = async () => {
            setLoadingData(true);
            try {
                const results = await getAliasOptions();
                const mailboxes = results.mailboxes;
                const suffix = results.suffixes[0].suffix;
                const signedSuffix = results.suffixes[0].signedSuffix;

                if (isMounted()) {
                    setFormValues({
                        ...formValues,
                        mailbox: mailboxes[0],
                        alias: suffix,
                        signedSuffix,
                    });
                    setAliasSuffix(suffix);
                    setMailboxes(mailboxes);
                    setLoadingData(false);
                }
            } catch (e) {
                console.error(e);
                traceInitiativeError('drawer-security-center', e);
                createNotification({
                    text: c('Error').t`An error occurred while loading alias options`,
                    type: 'error',
                });
                modalProps.onClose?.();
            }
        };

        void initForm();
    }, []);

    return (
        <ModalTwo size="small" {...modalProps}>
            <ModalTwoHeader />
            <ModalTwoContent data-testid="pass-aliases:create">
                <div className="text-center mb-4">
                    <img src={passAliasesLogo} alt="" />
                </div>
                <h1 className="text-center text-bold">{c('Security Center').t`Create alias`}</h1>
                <p className="text-center color-weak">
                    {c('Security Center')
                        .t`When asked for your email address, give this alias instead. Add a title and note to keep track of where you use it.`}
                </p>
                {loadingData && (
                    <div className="flex items-center min-h-custom" style={{ '--min-h-custom': '25em' }}>
                        <CircleLoader size="medium" className="color-primary m-auto" />
                    </div>
                )}
                {!loadingData && (
                    <Form
                        onSubmit={(e) => {
                            e.stopPropagation();
                            if (!hasErrors) {
                                void handleSubmit();
                            }
                        }}
                    >
                        <FormFieldWrapper hasError={!!errors?.note} isBigger classname="mb-2">
                            <InputFieldTwo<typeof Input>
                                type="text"
                                label={c('Label').t`Title`}
                                value={formValues.name}
                                className="text-bold rounded-none"
                                placeholder={c('Label').t`e.g., Amazon, eBay, Etsy`}
                                autoFocus
                                unstyled
                                onBlur={() => setBlurred({ ...blurred, name: true })}
                                onValue={(name: string) => {
                                    setFormValues({
                                        ...formValues,
                                        name,
                                        ...(!blurred.alias
                                            ? { alias: `${deriveAliasPrefix(name)}${aliasSuffix}` }
                                            : {}),
                                    });
                                }}
                                error={getFieldError('name')}
                            />
                        </FormFieldWrapper>

                        <FormGroupFieldWrapper classname="mb-4">
                            <FormFieldWrapper isGroupElement icon="alias" hasError={!!errors?.alias}>
                                <InputFieldTwo<typeof Input>
                                    label={c('Label').t`Your alias`}
                                    type="text"
                                    readOnly
                                    unstyled
                                    className="rounded-none"
                                    onBlur={() => setBlurred({ ...blurred, alias: true })}
                                    onValue={(alias: string) => {
                                        setFormValues({ ...formValues, alias });
                                    }}
                                    value={formValues.alias}
                                />
                            </FormFieldWrapper>
                            <FormFieldWrapper isGroupElement icon="arrow-up-and-right-big" hasError={!!errors?.mailbox}>
                                <InputFieldTwo<typeof SelectTwo<AliasOptions['mailboxes'][number]>>
                                    label={c('Label').t`Forwards to`}
                                    as={SelectTwo}
                                    onBlur={() => setBlurred({ ...blurred, mailbox: true })}
                                    unstyled
                                    className="rounded-none"
                                    onValue={(aliasMailbox: AliasMailbox) => {
                                        setFormValues({
                                            ...formValues,
                                            mailbox: aliasMailbox,
                                        });
                                    }}
                                    value={formValues.mailbox}
                                >
                                    {mailboxes.map((aliasMailbox) => (
                                        <Option key={aliasMailbox.id} title={aliasMailbox.email} value={aliasMailbox} />
                                    ))}
                                </InputFieldTwo>
                            </FormFieldWrapper>
                            <FormFieldWrapper isGroupElement icon="note" hasError={!!errors?.note}>
                                <InputFieldTwo<typeof TextAreaTwo>
                                    label={c('Label').t`Note`}
                                    as={TextAreaTwo}
                                    autoGrow
                                    unstyled
                                    className="rounded-none p-0 resize-none"
                                    placeholder={c('Security Center').t`Used on amazon for shopping, etc.`}
                                    onBlur={() => setBlurred({ ...blurred, note: true })}
                                    onValue={(note: string) => {
                                        setFormValues({ ...formValues, note });
                                    }}
                                />
                            </FormFieldWrapper>
                        </FormGroupFieldWrapper>
                    </Form>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm" loading={loadingSubmit} onClick={handleSubmit}>{c('Action')
                    .t`Create and copy alias`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreatePassAliasesForm;
