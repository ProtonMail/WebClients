import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { Input } from '@proton/atoms';
import { Button, CircleLoader, Href } from '@proton/atoms';
import {
    InputFieldTwo,
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    SelectTwo,
    TextAreaTwo,
} from '@proton/components/components';
import Form from '@proton/components/components/form/Form';
import { InputFieldStacked } from '@proton/components/components/inputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Option from '@proton/components/components/option/Option';
import { useNotifications } from '@proton/components/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import type { AliasMailbox, AliasOptions } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import passAliasesLogo from '@proton/styles/assets/img/illustrations/pass-aliases-logo.svg';

import { usePassAliasesContext } from '../../PassAliasesProvider';
import type { CreateModalFormState } from '../../interface';
import useCreateModalForm from './useCreatePassAliasesForm';

interface Props {
    onSubmit: () => void;
    modalProps: ModalProps;
    passAliasesURL: string;
}

const CreatePassAliasesForm = ({ modalProps, onSubmit, passAliasesURL }: Props) => {
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

    const passLink = (
        <Href key="pass-aliases-support-link" href={passAliasesURL}>
            {PASS_APP_NAME}
        </Href>
    );

    return (
        <ModalTwo size="small" {...modalProps}>
            <ModalTwoHeader />
            <ModalTwoContent data-testid="pass-aliases:create">
                <div className="text-center mb-4">
                    <img src={passAliasesLogo} alt="" />
                </div>
                <h1 className="text-center text-bold">{c('Security Center').t`Create alias`}</h1>
                <p className="text-center color-weak">
                    {
                        // translator: <passLink> text is "Proton Pass", with a link on it, to a Proton Pass page.
                        c('Security Center')
                            .jt`When asked for your email address, give this alias instead. Aliases are provided by ${passLink}.`
                    }
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
                        <InputFieldStacked hasError={!!errors?.note} isBigger classname="mb-2">
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
                        </InputFieldStacked>

                        <InputFieldStackedGroup classname="mb-4">
                            <InputFieldStacked isGroupElement icon="alias" hasError={!!errors?.alias}>
                                <InputFieldTwo<typeof Input>
                                    label={c('Label').t`Your alias`}
                                    type="text"
                                    readOnly
                                    unstyled
                                    inputClassName="rounded-none"
                                    onBlur={() => setBlurred({ ...blurred, alias: true })}
                                    onValue={(alias: string) => {
                                        setFormValues({ ...formValues, alias });
                                    }}
                                    value={formValues.alias}
                                />
                            </InputFieldStacked>
                            <InputFieldStacked
                                isGroupElement
                                icon="arrow-up-and-right-big"
                                hasError={!!errors?.mailbox}
                            >
                                <InputFieldTwo<typeof SelectTwo<AliasOptions['mailboxes'][number]>>
                                    label={c('Label').t`Forwards to`}
                                    as={SelectTwo}
                                    onBlur={() => setBlurred({ ...blurred, mailbox: true })}
                                    unstyled
                                    className="rounded-none"
                                    noDropdownCaret={mailboxes.length === 1}
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
                            </InputFieldStacked>
                            <InputFieldStacked isGroupElement icon="note" hasError={!!errors?.note}>
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
                            </InputFieldStacked>
                        </InputFieldStackedGroup>
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
