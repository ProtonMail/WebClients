import { type ReactElement, type VFC } from 'react';
import { useDispatch } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';
import uniqid from 'uniqid';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { itemCreationIntent } from '@proton/pass/store';
import { merge } from '@proton/pass/utils/object';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isEmptyString } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';

import type { ItemEditProps } from '../../../../shared/items';
import { deriveAliasPrefixFromName } from '../../../../shared/items/alias';
import { DropdownMenuButton } from '../../../components/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../../../components/Dropdown/QuickActionsDropdown';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { PasswordField } from '../../../components/Field/PasswordField';
import { TextField } from '../../../components/Field/TextField';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { UrlGroupField, createNewUrl } from '../../../components/Field/UrlGroupField';
import { ItemEditPanel } from '../../../components/Panel/ItemEditPanel';
import { AliasModal } from '../Alias/Alias.modal';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../Item/Item.validation';
import { type EditLoginItemFormValues, useLoginItemAliasModal, validateEditLoginForm } from './Login.validation';

const FORM_ID = 'edit-login';

export const LoginEdit: VFC<ItemEditProps<'login'>> = ({ vault, revision, onSubmit, onCancel }) => {
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;
    const {
        metadata: { name, note, itemUuid },
        content: { username, password, totpUri, urls },
        extraFields,
    } = item;

    const dispatch = useDispatch();

    const initialValues: EditLoginItemFormValues = {
        name,
        username,
        password,
        note,
        shareId,
        totpUri,
        url: '',
        urls: urls.map(createNewUrl),
        withAlias: false,
        aliasPrefix: '',
        aliasSuffix: undefined,
        mailboxes: [],
    };

    const form = useFormik<EditLoginItemFormValues>({
        initialValues,
        initialErrors: validateEditLoginForm(initialValues),
        onSubmit: ({ name, username, password, totpUri, url, urls, note, ...values }) => {
            const mutationTime = getEpoch();
            const withAlias =
                'withAlias' in values &&
                values.withAlias &&
                values.aliasSuffix !== undefined &&
                !isEmptyString(values.aliasPrefix) &&
                values.mailboxes.length > 0;

            const normalizedOtpUri = parseOTPValue(totpUri, {
                label: username || undefined,
                issuer: name || undefined,
            });

            if (withAlias) {
                const aliasOptimisticId = uniqid();

                dispatch(
                    itemCreationIntent({
                        type: 'alias',
                        optimisticId: aliasOptimisticId,
                        shareId,
                        createTime: mutationTime - 1 /* alias will be created before login in saga */,
                        metadata: {
                            name: `Alias for ${name}`,
                            note: '',
                            itemUuid: aliasOptimisticId,
                        },
                        content: {},
                        extraData: {
                            mailboxes: values.mailboxes,
                            prefix: values.aliasPrefix!,
                            signedSuffix: values.aliasSuffix!.signature,
                            aliasEmail: username,
                        },
                        extraFields: [],
                    })
                );
            }

            onSubmit({
                type: 'login',
                itemId,
                shareId,
                lastRevision,
                metadata: { name, note, itemUuid },
                content: {
                    username,
                    password,
                    urls: Array.from(new Set(urls.map(({ url }) => url).concat(isEmptyString(url) ? [] : [url]))),
                    totpUri: normalizedOtpUri,
                },
                extraFields,
            });
        },
        validate: validateEditLoginForm,
        validateOnChange: true,
    });

    const { relatedAlias, usernameIsAlias, willCreateAlias, canCreateAlias, aliasModalOpen, setAliasModalOpen } =
        useLoginItemAliasModal(form);

    return (
        <>
            <ItemEditPanel
                type="login"
                formId={FORM_ID}
                valid={form.isValid && form.dirty}
                discardable={!form.dirty}
                handleCancelClick={onCancel}
            >
                {() => (
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                <Field
                                    name="name"
                                    label={c('Label').t`Title`}
                                    component={TitleField}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                />
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <Field
                                    name="username"
                                    label={(() => {
                                        if (willCreateAlias) return c('Label').t`Username (new alias)`;
                                        if (relatedAlias) return c('Label').t`Username (alias)`;
                                        return c('Label').t`Username`;
                                    })()}
                                    placeholder={c('Placeholder').t`Enter email or username`}
                                    component={TextField}
                                    itemType="login"
                                    icon={usernameIsAlias ? 'alias' : 'user'}
                                    actions={
                                        [
                                            willCreateAlias && (
                                                <QuickActionsDropdown color="weak" shape="solid" key="edit-alias">
                                                    <DropdownMenuButton
                                                        className="flex flex-align-items-center text-left"
                                                        onClick={() =>
                                                            form.setValues((values) =>
                                                                merge(values, {
                                                                    withAlias: false,
                                                                    aliasPrefix: '',
                                                                    aliasSuffix: undefined,
                                                                    mailboxes: [],
                                                                    username: initialValues.username,
                                                                })
                                                            )
                                                        }
                                                    >
                                                        <Icon name="trash" className="mr0-5" />
                                                        {c('Action').t`Delete alias`}
                                                    </DropdownMenuButton>
                                                </QuickActionsDropdown>
                                            ),
                                            canCreateAlias && (
                                                <Button
                                                    icon
                                                    pill
                                                    color="weak"
                                                    shape="solid"
                                                    size="medium"
                                                    className="pass-item-icon"
                                                    title={c('Action').t`Generate alias`}
                                                    key="generate-alias"
                                                    onClick={() =>
                                                        form
                                                            .setValues((values) =>
                                                                merge(values, {
                                                                    withAlias: true,
                                                                    aliasPrefix: deriveAliasPrefixFromName(values.name),
                                                                    aliasSuffix: undefined,
                                                                    mailboxes: [],
                                                                })
                                                            )
                                                            .then<any>(() => form.setFieldTouched('aliasPrefix', false))
                                                            .finally(() => setAliasModalOpen(true))
                                                    }
                                                >
                                                    <Icon name="alias" size={20} />
                                                </Button>
                                            ),
                                        ].filter(Boolean) as ReactElement[]
                                    }
                                />

                                <Field
                                    name="password"
                                    label={c('Label').t`Password`}
                                    placeholder={c('Placeholder').t`Enter password`}
                                    component={PasswordField}
                                    icon="key"
                                />

                                <Field
                                    name="totpUri"
                                    label={c('Label').t`2FA secret (TOTP)`}
                                    placeholder={c('Placeholder').t`Add 2FA secret`}
                                    component={PasswordField}
                                    actions={[]}
                                    icon="lock"
                                />
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <UrlGroupField form={form} />
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <Field
                                    name="note"
                                    label={c('Label').t`Note`}
                                    placeholder={c('Placeholder').t`Enter a note...`}
                                    component={TextAreaField}
                                    icon="note"
                                    maxLength={MAX_ITEM_NOTE_LENGTH}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                )}
            </ItemEditPanel>

            <AliasModal
                open={aliasModalOpen}
                onClose={() =>
                    form
                        .setValues((values) =>
                            merge(values, {
                                withAlias: false,
                                aliasPrefix: '',
                                aliasSuffix: undefined,
                                mailboxes: [],
                            })
                        )
                        .then<any>(() => form.setFieldTouched('aliasPrefix', undefined))
                        .finally(() => setAliasModalOpen(false))
                }
                handleSubmitClick={() =>
                    form
                        .setValues((values) => {
                            const { aliasPrefix, aliasSuffix } = values;
                            return !isEmptyString(aliasPrefix) && aliasSuffix
                                ? merge(values, { username: aliasPrefix! + aliasSuffix!.value })
                                : values;
                        })
                        .then<any>(() => form.setFieldTouched('aliasPrefix', true))
                        .finally(() => setAliasModalOpen(false))
                }
                form={form}
                shareId={shareId}
            />
        </>
    );
};
