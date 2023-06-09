import { type ReactElement, type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenuButton, Icon } from '@proton/components';
import { selectTOTPLimits, selectVaultLimits } from '@proton/pass/store';
import { type LoginWithAliasCreationDTO } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { merge } from '@proton/pass/utils/object';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isEmptyString, uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL } from '@proton/pass/utils/url';

import { UpgradeButton } from '../../../../shared/components/upgrade/UpgradeButton';
import { useFeatureFlag } from '../../../../shared/hooks/useFeatureFlag';
import type { ItemNewProps } from '../../../../shared/items';
import { deriveAliasPrefix } from '../../../../shared/items/alias';
import { QuickActionsDropdown } from '../../../components/Dropdown/QuickActionsDropdown';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { ExtraFieldGroup } from '../../../components/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { PasswordField } from '../../../components/Field/PasswordField';
import { TextField } from '../../../components/Field/TextField';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { UrlGroupField, createNewUrl } from '../../../components/Field/UrlGroupField';
import { VaultSelectField } from '../../../components/Field/VaultSelectField';
import { ItemCreatePanel } from '../../../components/Panel/ItemCreatePanel';
import { usePopupContext } from '../../../hooks/usePopupContext';
import { AliasModal } from '../Alias/Alias.modal';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../Item/Item.validation';
import {
    type LoginItemFormValues,
    type NewLoginItemFormValues,
    useLoginItemAliasModal,
    validateLoginForm,
} from './Login.validation';

const FORM_ID = 'new-login';

export const LoginNew: VFC<ItemNewProps<'login'>> = ({ shareId, onSubmit, onCancel }) => {
    const { domain, subdomain } = usePopupContext().url;
    const { search } = useLocation();

    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { needsUpgrade } = useSelector(selectTOTPLimits);

    const showCustomFields = useFeatureFlag<boolean>(PassFeature.PassCustomFields);

    const initialValues: LoginItemFormValues = useMemo(() => {
        const params = new URLSearchParams(search);
        const maybeUrl = subdomain ?? domain ?? '';
        const { valid, url } = isValidURL(maybeUrl);

        return {
            shareId,
            name: maybeUrl,
            username: params.get('username') ?? '',
            password: '',
            note: '',
            totpUri: '',
            url: valid ? createNewUrl(url).url : '',
            urls: [],
            withAlias: false,
            aliasPrefix: '',
            aliasSuffix: undefined,
            mailboxes: [],
            extraFields: [],
        };
    }, []);

    const form = useFormik<NewLoginItemFormValues>({
        initialValues,
        initialErrors: validateLoginForm(initialValues),
        onSubmit: ({ name, note, username, password, shareId, totpUri, url, urls, extraFields, ...values }) => {
            const createTime = getEpoch();
            const optimisticId = uniqueId();

            const withAlias =
                values.withAlias &&
                values.aliasSuffix !== undefined &&
                !isEmptyString(values.aliasPrefix) &&
                values.mailboxes.length > 0;

            const extraData: LoginWithAliasCreationDTO = withAlias
                ? {
                      withAlias: true,
                      alias: {
                          type: 'alias',
                          optimisticId: `${optimisticId}-alias`,
                          shareId,
                          createTime,
                          metadata: {
                              name: `Alias for ${name}`,
                              note: '',
                              itemUuid: `${optimisticId}-alias`,
                          },
                          content: {},
                          extraData: {
                              mailboxes: values.mailboxes,
                              prefix: values.aliasPrefix!,
                              signedSuffix: values.aliasSuffix!.signature,
                              aliasEmail: username,
                          },
                          extraFields: [],
                      },
                  }
                : { withAlias: false };

            const normalizedOtpUri = parseOTPValue(totpUri, {
                label: username || undefined,
                issuer: name || undefined,
            });

            onSubmit({
                type: 'login',
                optimisticId,
                shareId,
                createTime,
                metadata: {
                    name,
                    note,
                    itemUuid: optimisticId,
                },
                content: {
                    username,
                    password,
                    urls: Array.from(new Set(urls.map(({ url }) => url).concat(isEmptyString(url) ? [] : [url]))),
                    totpUri: normalizedOtpUri,
                },
                extraFields: extraFields.map((field) => {
                    if (field.type === 'totp') {
                        return {
                            ...field,
                            value: parseOTPValue(field.data.totpUri, {
                                label: username || undefined,
                                issuer: name || undefined,
                            }),
                        };
                    }
                    return field;
                }),
                extraData,
            });
        },
        validate: validateLoginForm,
        validateOnBlur: true,
    });

    const { relatedAlias, usernameIsAlias, willCreateAlias, canCreateAlias, aliasModalOpen, setAliasModalOpen } =
        useLoginItemAliasModal(form);

    return (
        <>
            <ItemCreatePanel
                type="login"
                formId={FORM_ID}
                valid={form.isValid}
                handleCancelClick={onCancel}
                discardable={!form.dirty}
            >
                {({ didMount }) => (
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                {vaultTotalCount > 1 && (
                                    <Field component={VaultSelectField} label={c('Label').t`Vault`} name="shareId" />
                                )}
                                <Field
                                    name="name"
                                    label={c('Label').t`Title`}
                                    placeholder={c('Placeholder').t`Untitled`}
                                    component={TitleField}
                                    autoFocus={didMount}
                                    key={`login-name-${didMount}`}
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
                                                        <Icon name="trash" className="mr-2" />
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
                                                                    aliasPrefix: deriveAliasPrefix(values.name),
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
                                    icon="key"
                                    component={PasswordField}
                                />

                                {
                                    /* only allow adding a new TOTP code if user
                                     * has not reached his plan's totp limit */
                                    needsUpgrade ? (
                                        <ValueControl icon="lock" label={c('Label').t`2FA secret (TOTP)`}>
                                            <UpgradeButton inline />
                                        </ValueControl>
                                    ) : (
                                        <Field
                                            masked
                                            name="totpUri"
                                            label={c('Label').t`2FA secret (TOTP)`}
                                            placeholder={c('Placeholder').t`Add 2FA secret`}
                                            component={TextField}
                                            icon="lock"
                                        />
                                    )
                                }
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <UrlGroupField form={form} />
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <Field
                                    name="note"
                                    label={c('Label').t`Note`}
                                    placeholder={c('Placeholder').t`Add note`}
                                    component={TextAreaField}
                                    icon="note"
                                    maxLength={MAX_ITEM_NOTE_LENGTH}
                                />
                            </FieldsetCluster>

                            {Boolean(showCustomFields) && <ExtraFieldGroup form={form} />}
                        </Form>
                    </FormikProvider>
                )}
            </ItemCreatePanel>

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
