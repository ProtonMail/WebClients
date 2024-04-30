import { type FC, type ReactElement, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { PasswordField } from '@proton/pass/components/Form/Field/PasswordField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { UrlGroupField, createNewUrl } from '@proton/pass/components/Form/Field/UrlGroupField';
import { VaultSelectField } from '@proton/pass/components/Form/Field/VaultSelectField';
import { AliasModal } from '@proton/pass/components/Item/Alias/Alias.modal';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { usePasswordContext } from '@proton/pass/components/Password/PasswordProvider';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import {
    deriveAliasPrefix,
    sanitizeLoginAliasHydration,
    sanitizeLoginAliasSave,
} from '@proton/pass/lib/validation/alias';
import { validateLoginForm } from '@proton/pass/lib/validation/login';
import { selectTOTPLimits, selectVaultLimits } from '@proton/pass/store/selectors';
import type { LoginItemFormValues, NewLoginItemFormValues } from '@proton/pass/types';
import { type LoginWithAliasCreationDTO } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';
import { parseUrl } from '@proton/pass/utils/url/parser';

const FORM_ID = 'new-login';

export const LoginNew: FC<ItemNewViewProps<'login'>> = ({ shareId, url, onCancel, onSubmit }) => {
    const passwordContext = usePasswordContext();
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { needsUpgrade } = useSelector(selectTOTPLimits);

    const { domain, subdomain } = url ?? {};
    const { search } = useLocation();
    const history = useHistory();

    const searchParams = new URLSearchParams(search);

    const initialValues: LoginItemFormValues = useMemo(() => {
        const maybeUrl = subdomain ?? domain ?? '';
        const { valid, url } = isValidURL(maybeUrl);

        return {
            aliasPrefix: '',
            aliasSuffix: undefined,
            extraFields: [],
            mailboxes: [],
            name: maybeUrl,
            note: '',
            passkeys: [],
            password: '',
            shareId,
            totpUri: '',
            url: valid ? createNewUrl(url).url : '',
            urls: [],
            username: searchParams.get('username') ?? '',
            withAlias: false,
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
                              note: obfuscate(''),
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
                    note: obfuscate(note),
                    itemUuid: optimisticId,
                },
                content: {
                    username: obfuscate(username),
                    password: obfuscate(password),
                    urls: Array.from(new Set(urls.map(({ url }) => url).concat(isEmptyString(url) ? [] : [url]))),
                    totpUri: obfuscate(normalizedOtpUri),
                    passkeys: [],
                },
                extraFields: obfuscateExtraFields(
                    extraFields.map((field) =>
                        field.type === 'totp'
                            ? {
                                  ...field,
                                  data: {
                                      totpUri: parseOTPValue(field.data.totpUri, {
                                          label: username || undefined,
                                          issuer: name || undefined,
                                      }),
                                  },
                              }
                            : field
                    )
                ),
                extraData,
            });
        },
        validate: validateLoginForm,
        validateOnBlur: true,
    });

    const { aliasOptions, ...aliasModal } = useAliasForLoginModal(form);

    const draft = useItemDraft<NewLoginItemFormValues>(form, {
        type: 'login',
        mode: 'new',
        sanitizeSave: sanitizeLoginAliasSave,
        sanitizeHydration: sanitizeLoginAliasHydration(aliasOptions.value),
        onHydrated: (draft) => draft?.withAlias && aliasOptions.request(),
    });

    useEffect(
        () => () => {
            searchParams.delete('username');
            history.replace({ search: searchParams.toString() });
        },
        []
    );

    return (
        <>
            <ItemCreatePanel
                type="login"
                formId={FORM_ID}
                valid={form.isValid}
                handleCancelClick={onCancel}
                discardable={!form.dirty}
            >
                {({ didEnter }) => (
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
                                    autoFocus={!draft && didEnter}
                                    key={`login-name-${didEnter}`}
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
                                                        label={c('Action').t`Delete alias`}
                                                        icon="trash"
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
                                                    />
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
                                                    tabIndex={-1}
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
                                                    <Icon name="alias" size={5} />
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
                                    showStrength
                                    onPasswordGenerated={(value: string) => {
                                        const { urls, url } = form.values;
                                        const baseUrl = urls?.[0]?.url ?? url;
                                        const { subdomain, domain, hostname } = parseUrl(baseUrl);
                                        const origin = subdomain ?? domain ?? hostname;
                                        passwordContext.history.add({ value, origin });
                                    }}
                                />

                                {
                                    /* only allow adding a new TOTP code if user
                                     * has not reached his plan's TOTP limit */
                                    needsUpgrade ? (
                                        <ValueControl icon="lock" label={c('Label').t`2FA secret key (TOTP)`}>
                                            <UpgradeButton inline upsellRef={UpsellRef.LIMIT_2FA} />
                                        </ValueControl>
                                    ) : (
                                        <Field
                                            hidden
                                            name="totpUri"
                                            label={c('Label').t`2FA secret key (TOTP)`}
                                            placeholder={c('Placeholder').t`Add 2FA secret key`}
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
                aliasOptions={aliasOptions.value}
                loading={aliasOptions.loading}
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
