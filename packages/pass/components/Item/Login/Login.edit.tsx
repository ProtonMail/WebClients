import { type FC, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import noop from '@proton/utils/noop';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '../../../constants';
import { useAliasForLogin } from '../../../hooks/useAliasForLogin';
import { useDeobfuscatedItem } from '../../../hooks/useDeobfuscatedItem';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { obfuscateExtraFields } from '../../../lib/items/item.obfuscation';
import { bindOTPSanitizer, getSanitizedUserIdentifiers, sanitizeExtraField } from '../../../lib/items/item.utils';
import { getSecretOrUri } from '../../../lib/otp/otp';
import { createNewUrlItem, fromItems } from '../../../lib/urls/utils/autofill';
import { resolveSubdomain } from '../../../lib/urls/utils/utils';
import { sanitizeLoginAliasHydration, sanitizeLoginAliasSave } from '../../../lib/validation/alias';
import { validateLoginForm } from '../../../lib/validation/login';
import { isWritableVault } from '../../../lib/vaults/vault.predicates';
import { itemCreate } from '../../../store/actions';
import { selectShowUsernameField, selectTOTPLimits, selectUserDefaultShareID } from '../../../store/selectors';
import type { LoginItemFormValues } from '../../../types';
import { arrayRemove } from '../../../utils/array/remove';
import { prop } from '../../../utils/fp/lens';
import { pipe } from '../../../utils/fp/pipe';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { isEmptyString } from '../../../utils/string/is-empty-string';
import { uniqueId } from '../../../utils/string/unique-id';
import { getEpoch } from '../../../utils/time/epoch';
import { FileAttachmentsFieldEdit } from '../../FileAttachments/FileAttachmentsFieldEdit';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '../../Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../Form/Field/TextField';
import { TextAreaField } from '../../Form/Field/TextareaField';
import { TitleField } from '../../Form/Field/TitleField';
import { UrlGroupField } from '../../Form/Field/UrlGroup/UrlGroupField';
import { ItemEditPanel } from '../../Layout/Panel/ItemEditPanel';
import { UpgradeButton } from '../../Upsell/UpgradeButton';
import type { ItemEditViewProps } from '../../Views/types';
import { LoginEditCredentials } from './Login.edit.credentials';

const FORM_ID = 'edit-login';

export const LoginEdit: FC<ItemEditViewProps<'login'>> = ({ revision, url, share, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const { needsUpgrade } = useSelector(selectTOTPLimits);
    const showUsernameField = useSelector(selectShowUsernameField);
    const defaultShareID = useSelector(selectUserDefaultShareID);

    const domain = url ? resolveSubdomain(url) : null;
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
            urls: content.autofillUrls.map(createNewUrlItem),
            editingUrlIndex: null,
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

            /** NOTE: if we're creating an alias on an ItemShare or a non-writable
             * vault, fallback to the user's default share ID */
            const aliasShareID = isWritableVault(share) ? shareId : defaultShareID;

            if (withAlias && aliasShareID) {
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
                        shareId: aliasShareID,
                        type: 'alias',
                        optimisticTime: getEpoch() - 1 /* alias will be created before login in saga */,
                    })
                );
            }

            const { email, username } = await getSanitizedUserIdentifiers({ itemEmail, itemUsername });
            const sanitizeOTP = bindOTPSanitizer(itemEmail, name);

            onSubmit({
                ...uneditable,
                content: {
                    ...content,
                    passkeys,
                    password: obfuscate(password),
                    totpUri: pipe(sanitizeOTP, obfuscate)(totpUri),
                    autofillUrls: fromItems(urls, url),
                    itemEmail: obfuscate(email),
                    itemUsername: obfuscate(username),
                },
                files,
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
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

    const alias = useAliasForLogin(form);
    const { aliasOptions } = alias;

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
                                                <IcCross size={3} />
                                            </Button>,
                                        ]}
                                    />
                                </FieldsetCluster>
                            ))}

                            <FieldsetCluster>
                                <LoginEditCredentials form={form} alias={alias} />

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
                                    initialTestUrl={url?.url ?? undefined}
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
                                                      <IcPlus /> {c('Action').t`Add current URL`}
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

                            <FieldsetCluster>
                                <Field
                                    name="files"
                                    component={FileAttachmentsFieldEdit}
                                    shareId={shareId}
                                    itemId={itemId}
                                    revision={lastRevision}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                )}
            </ItemEditPanel>
        </>
    );
};
