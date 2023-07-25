import { type ReactElement, type VFC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenuButton, Icon } from '@proton/components';
import { selectTOTPLimits, selectVaultLimits } from '@proton/pass/store';
import { passwordSave } from '@proton/pass/store/actions/creators/pw-history';
import { type LoginWithAliasCreationDTO } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isEmptyString, uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { isValidURL, parseUrl } from '@proton/pass/utils/url';

import { UpgradeButton } from '../../../../shared/components/upgrade/UpgradeButton';
import type { LoginItemFormValues, NewLoginItemFormValues } from '../../../../shared/form/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import { validateLoginForm } from '../../../../shared/form/validator/validate-login';
import type { ItemNewProps } from '../../../../shared/items';
import { deriveAliasPrefix, sanitizeLoginAliasHydration, sanitizeLoginAliasSave } from '../../../../shared/items/alias';
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
import { useAliasForLoginModal } from '../../../hooks/useAliasForLoginModal';
import { useDraftSync, useItemDraft } from '../../../hooks/useItemDraft';
import { usePopupContext } from '../../../hooks/usePopupContext';
import { AliasModal } from '../Alias/Alias.modal';

const FORM_ID = 'new-login';

export const LoginNew: VFC<ItemNewProps<'login'>> = ({ shareId, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const { domain, subdomain } = usePopupContext().url;
    const { search } = useLocation();

    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { needsUpgrade } = useSelector(selectTOTPLimits);

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

    const itemDraft = useItemDraft<NewLoginItemFormValues>();
    const aliasModal = useAliasForLoginModal(form, { lazy: !itemDraft?.formData.withAlias });

    const draft = useDraftSync<NewLoginItemFormValues>(form, {
        type: 'login',
        mode: 'new',
        itemId: 'draft-login',
        shareId: form.values.shareId,
        sanitizeSave: sanitizeLoginAliasSave,
        sanitizeHydration: sanitizeLoginAliasHydration(aliasModal.aliasOptions),
    });

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
                                    autoFocus={!draft && didMount}
                                    key={`login-name-${didMount}`}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                />
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <Field
                                    name="username"
                                    label={(() => {
                                        if (aliasModal.willCreate) return c('Label').t`Username (new alias)`;
                                        if (aliasModal.relatedAlias) return c('Label').t`Username (alias)`;
                                        return c('Label').t`Username`;
                                    })()}
                                    placeholder={c('Placeholder').t`Enter email or username`}
                                    component={TextField}
                                    itemType="login"
                                    icon={aliasModal.usernameIsAlias ? 'alias' : 'user'}
                                    actions={
                                        [
                                            aliasModal.willCreate && (
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
                                            aliasModal.canCreate && (
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
                                                            .finally(() => aliasModal.setOpen(true))
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
                                    onPasswordGenerated={(value: string) => {
                                        const { urls, url } = form.values;
                                        const baseUrl = urls?.[0]?.url ?? url;
                                        const { subdomain, domain, hostname } = parseUrl(baseUrl);

                                        dispatch(
                                            passwordSave({
                                                id: uniqueId(),
                                                value,
                                                origin: subdomain ?? domain ?? hostname,
                                                createTime: getEpoch(),
                                            })
                                        );
                                    }}
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
                                            hidden
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

                            <ExtraFieldGroup form={form} />
                        </Form>
                    </FormikProvider>
                )}
            </ItemCreatePanel>

            <AliasModal
                form={form}
                shareId={shareId}
                aliasOptions={aliasModal.aliasOptions}
                loading={aliasModal.loading}
                open={aliasModal.open}
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
                        .finally(() => aliasModal.setOpen(false))
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
                        .finally(() => aliasModal.setOpen(false))
                }
            />
        </>
    );
};
