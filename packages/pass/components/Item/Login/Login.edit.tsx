import { type FC, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { FileAttachmentsFieldEdit } from '@proton/pass/components/FileAttachments/FileAttachmentsFieldEdit';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { UrlGroupField, createNewUrl } from '@proton/pass/components/Form/Field/UrlGroupField';
import { LoginEditCredentials } from '@proton/pass/components/Item/Login/Login.edit.credentials';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { getSanitizedUserIdentifiers } from '@proton/pass/lib/items/item.utils';
import { getSecretOrUri, parseOTPValue } from '@proton/pass/lib/otp/otp';
import { sanitizeLoginAliasHydration, sanitizeLoginAliasSave } from '@proton/pass/lib/validation/alias';
import { validateLoginForm } from '@proton/pass/lib/validation/login';
import { itemCreate } from '@proton/pass/store/actions';
import { selectShowUsernameField, selectTOTPLimits } from '@proton/pass/store/selectors';
import type { LoginItemFormValues } from '@proton/pass/types';
import { arrayRemove } from '@proton/pass/utils/array/remove';
import { prop } from '@proton/pass/utils/fp/lens';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { resolveDomain } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

const FORM_ID = 'edit-login';

export const LoginEdit: FC<ItemEditViewProps<'login'>> = ({ revision, url, share, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const { needsUpgrade } = useSelector(selectTOTPLimits);
    const showUsernameField = useSelector(selectShowUsernameField);

    const domain = url ? resolveDomain(url) : null;
    const { shareId } = share;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, content, extraFields, ...uneditable } = useDeobfuscatedItem(item);

    /** On initial mount: expand username field by default IIF:
     * - user has enabled the `showUsernameField` setting
     * - both username & field are populated */
    const initialValues: LoginItemFormValues = useMemo(
        () => ({
            aliasPrefix: '',
            aliasSuffix: undefined,
            extraFields,
            files: filesFormInitializer(),
            itemEmail: content.itemEmail,
            itemUsername: content.itemUsername,
            mailboxes: [],
            name: metadata.name,
            note: metadata.note,
            passkeys: content.passkeys ?? [],
            password: content.password,
            shareId,
            totpUri: getSecretOrUri(content.totpUri),
            url: '',
            urls: content.urls.map(createNewUrl),
            withAlias: false,
            withUsername: showUsernameField,
        }),
        []
    );

    const form = useFormik<LoginItemFormValues>({
        initialValues,
        onSubmit: async ({
            name,
            files,
            itemEmail,
            itemUsername,
            password,
            totpUri,
            url,
            urls,
            note,
            extraFields,
            passkeys,
            ...values
        }) => {
            const withAlias =
                'withAlias' in values &&
                values.withAlias &&
                values.aliasSuffix !== undefined &&
                !isEmptyString(values.aliasPrefix) &&
                values.mailboxes.length > 0;

            const normalizedOtpUri = parseOTPValue(totpUri, {
                label: itemEmail || undefined,
                issuer: name || undefined,
            });

            if (withAlias) {
                const aliasOptimisticId = uniqueId();

                dispatch(
                    itemCreate.intent({
                        content: {},
                        files,
                        extraData: {
                            mailboxes: values.mailboxes,
                            prefix: values.aliasPrefix!,
                            signedSuffix: values.aliasSuffix!.signature,
                            aliasEmail: itemEmail,
                        },
                        extraFields: [],
                        metadata: { name: `Alias for ${name}`, note: obfuscate(''), itemUuid: aliasOptimisticId },
                        optimisticId: aliasOptimisticId,
                        shareId,
                        type: 'alias',
                        optimisticTime: getEpoch() - 1 /* alias will be created before login in saga */,
                    })
                );
            }

            const { email, username } = await getSanitizedUserIdentifiers({ itemEmail, itemUsername });

            onSubmit({
                ...uneditable,
                content: {
                    ...content,
                    passkeys,
                    password: obfuscate(password),
                    totpUri: obfuscate(normalizedOtpUri),
                    urls: Array.from(new Set(urls.map(({ url }) => url).concat(isEmptyString(url) ? [] : [url]))),
                    itemEmail: obfuscate(email),
                    itemUsername: obfuscate(username),
                },
                files,
                extraFields: obfuscateExtraFields(
                    extraFields.map((field) =>
                        field.type === 'totp'
                            ? {
                                  ...field,
                                  data: {
                                      totpUri: parseOTPValue(field.data.totpUri, {
                                          label: itemEmail || undefined,
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
        validate: (values) => validateLoginForm({ values }),
        validateOnChange: true,
        validateOnMount: true,
    });

    const showQuickAddUrl =
        domain &&
        !form.values.urls
            .map(prop('url'))
            .concat(form.values.url)
            .some((url) => url.includes(domain));

    const { aliasOptions } = useAliasForLoginModal(form);

    const draft = useItemDraft<LoginItemFormValues>(form, {
        mode: 'edit',
        itemId: itemId,
        shareId: form.values.shareId,
        revision: lastRevision,
        sanitizeSave: sanitizeLoginAliasSave,
        sanitizeHydration: sanitizeLoginAliasHydration(aliasOptions.value),
        onHydrated: (draft) => draft?.withAlias && aliasOptions.request(),
    });

    useEffect(() => {
        if (!draft) {
            getSanitizedUserIdentifiers(content)
                .then(({ username, email }) => {
                    /** On mount, if username field is not expanded, use the `itemEmail` as
                     * the virtual `Email or username` field value. This should be sanitized
                     * on save by checking if the provided value is a valid email.  */
                    const withUsername = form.values.withUsername || Boolean(username && email);
                    const itemEmail = withUsername ? email : username || email;
                    const itemUsername = withUsername ? username : '';

                    form.resetForm({
                        values: { ...form.values, itemUsername, itemEmail, withUsername },
                    });
                })
                .catch(noop);
        }
    }, []);

    return (
        <>
            <ItemEditPanel
                type="login"
                formId={FORM_ID}
                valid={form.isValid && form.dirty && !form.status?.isBusy}
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
                                <LoginEditCredentials form={form} />

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
                                                      onClick={() => handleAdd(domain)}
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

                            <FieldsetCluster>
                                <Field
                                    name="files"
                                    component={FileAttachmentsFieldEdit}
                                    shareId={shareId}
                                    itemId={itemId}
                                    revision={lastRevision}
                                />
                            </FieldsetCluster>

                            <ExtraFieldGroup form={form} />
                        </Form>
                    </FormikProvider>
                )}
            </ItemEditPanel>
        </>
    );
};
