import { type FC, type ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { PasswordField } from '@proton/pass/components/Form/Field/PasswordField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { UrlGroupField, createNewUrl } from '@proton/pass/components/Form/Field/UrlGroupField';
import { AliasModal } from '@proton/pass/components/Item/Alias/Alias.modal';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import { usePasswordContext } from '@proton/pass/components/Password/PasswordProvider';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { getSecretOrUri, parseOTPValue } from '@proton/pass/lib/otp/otp';
import {
    deriveAliasPrefix,
    sanitizeLoginAliasHydration,
    sanitizeLoginAliasSave,
} from '@proton/pass/lib/validation/alias';
import { validateLoginForm } from '@proton/pass/lib/validation/login';
import { itemCreationIntent } from '@proton/pass/store/actions';
import { selectTOTPLimits } from '@proton/pass/store/selectors';
import type { EditLoginItemFormValues } from '@proton/pass/types';
import { arrayRemove } from '@proton/pass/utils/array/remove';
import { prop } from '@proton/pass/utils/fp/lens';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';

const FORM_ID = 'edit-login';

export const LoginEdit: FC<ItemEditViewProps<'login'>> = ({ revision, url, vault, onSubmit, onCancel }) => {
    const passwordContext = usePasswordContext();
    const dispatch = useDispatch();
    const { needsUpgrade } = useSelector(selectTOTPLimits);
    const { domain, subdomain } = url ?? {};
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, content, extraFields, ...uneditable } = useDeobfuscatedItem(item);

    const initialValues: EditLoginItemFormValues = {
        aliasPrefix: '',
        aliasSuffix: undefined,
        extraFields,
        mailboxes: [],
        name: metadata.name,
        note: metadata.note,
        passkeys: content.passkeys ?? [],
        password: content.password,
        shareId,
        totpUri: getSecretOrUri(content.totpUri),
        url: '',
        urls: content.urls.map(createNewUrl),
        username: content.username,
        withAlias: false,
    };

    const form = useFormik<EditLoginItemFormValues>({
        initialValues,
        onSubmit: ({ name, username, password, totpUri, url, urls, note, extraFields, passkeys, ...values }) => {
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
                const aliasOptimisticId = uniqueId();

                dispatch(
                    itemCreationIntent({
                        content: {},
                        createTime: mutationTime - 1 /* alias will be created before login in saga */,
                        extraData: {
                            mailboxes: values.mailboxes,
                            prefix: values.aliasPrefix!,
                            signedSuffix: values.aliasSuffix!.signature,
                            aliasEmail: username,
                        },
                        extraFields: [],
                        metadata: { name: `Alias for ${name}`, note: obfuscate(''), itemUuid: aliasOptimisticId },
                        optimisticId: aliasOptimisticId,
                        shareId,
                        type: 'alias',
                    })
                );
            }

            onSubmit({
                ...uneditable,
                content: {
                    ...content,
                    passkeys,
                    password: obfuscate(password),
                    totpUri: obfuscate(normalizedOtpUri),
                    urls: Array.from(new Set(urls.map(({ url }) => url).concat(isEmptyString(url) ? [] : [url]))),
                    username: obfuscate(username),
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
                itemId,
                lastRevision,
                metadata: { ...metadata, name, note: obfuscate(note) },
                shareId,
            });
        },
        validate: validateLoginForm,
        validateOnChange: true,
        validateOnMount: true,
    });

    const showQuickAddUrl =
        (subdomain || domain) &&
        !form.values.urls
            .map(prop('url'))
            .concat(form.values.url)
            .some((url) => url.includes(subdomain ?? domain!));

    const { aliasOptions, ...aliasModal } = useAliasForLoginModal(form);

    useItemDraft<EditLoginItemFormValues>(form, {
        mode: 'edit',
        itemId: itemId,
        shareId: form.values.shareId,
        revision: lastRevision,
        sanitizeSave: sanitizeLoginAliasSave,
        sanitizeHydration: sanitizeLoginAliasHydration(aliasOptions.value),
        onHydrated: (draft) => draft?.withAlias && aliasOptions.request(),
    });

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
                                    lengthLimiters
                                    name="name"
                                    label={c('Label').t`Title`}
                                    component={TitleField}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                />
                            </FieldsetCluster>

                            {form.values.passkeys.map((passkey, idx, passkeys) => (
                                <FieldsetCluster key={passkey.keyId}>
                                    <ValueControl
                                        icon={'pass-passkey'}
                                        label={`${c('Label').t`Passkey`} • ${passkey.domain}`}
                                        value={passkey.userName}
                                        valueClassName="cursor-default"
                                        actions={[
                                            <Button
                                                className="mt-1"
                                                shape="ghost"
                                                pill
                                                icon
                                                onClick={() =>
                                                    form.setFieldValue('passkeys', arrayRemove(passkeys, idx))
                                                }
                                            >
                                                <Icon name="cross" size={3} />
                                            </Button>,
                                        ]}
                                    />
                                </FieldsetCluster>
                            ))}

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
                                    component={PasswordField}
                                    icon="key"
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
                                     * has not reached his plan's TOTP limit. If
                                     * the user has downgraded and this item had
                                     * a TOTP item, allow edit so user can retrieve
                                     * the secret or remove it */
                                    needsUpgrade && isEmptyString(form.values.totpUri) ? (
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
                                <UrlGroupField
                                    form={form}
                                    renderExtraActions={
                                        showQuickAddUrl
                                            ? ({ handleAdd }) => (
                                                  <Button
                                                      icon
                                                      color="norm"
                                                      shape="ghost"
                                                      size="small"
                                                      key="add-current-url"
                                                      title={c('Action').t`Add current URL`}
                                                      className="flex items-center gap-1"
                                                      onClick={() => handleAdd(subdomain ?? domain!)}
                                                  >
                                                      <Icon name="plus" /> {c('Action').t`Add current URL`}
                                                  </Button>
                                              )
                                            : undefined
                                    }
                                />
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
            </ItemEditPanel>

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
