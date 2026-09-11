import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '../../../constants';
import { useInitialValues } from '../../../hooks/items/useInitialValues';
import { useAliasForLogin } from '../../../hooks/useAliasForLogin';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { usePortal } from '../../../hooks/usePortal';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { obfuscateExtraFields } from '../../../lib/items/item.obfuscation';
import { bindOTPSanitizer, getSanitizedUserIdentifiers, sanitizeExtraField } from '../../../lib/items/item.utils';
import { getSecretOrUri } from '../../../lib/otp/otp';
import { createNewUrlItem, fromItems } from '../../../lib/urls/utils/autofill';
import { sanitizeURL } from '../../../lib/urls/utils/sanitize';
import { intoDomainWithPort, resolveSubdomain } from '../../../lib/urls/utils/utils';
import { sanitizeLoginAliasHydration, sanitizeLoginAliasSave } from '../../../lib/validation/alias';
import { validateLoginForm } from '../../../lib/validation/login';
import { selectShowUsernameField, selectTOTPLimits, selectVaultLimits } from '../../../store/selectors';
import type { LoginItemFormValues, LoginWithAliasCreationDTO } from '../../../types';
import { AutofillMode } from '../../../types/protobuf';
import { pipe } from '../../../utils/fp/pipe';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { isEmptyString } from '../../../utils/string/is-empty-string';
import { uniqueId } from '../../../utils/string/unique-id';
import { FileAttachmentsField } from '../../FileAttachments/FileAttachmentsField';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '../../Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../Form/Field/TextField';
import { TextAreaField } from '../../Form/Field/TextareaField';
import { TitleField } from '../../Form/Field/TitleField';
import { UrlGroupField } from '../../Form/Field/UrlGroup/UrlGroupField';
import { VaultPickerField } from '../../Form/Field/VaultPickerField';
import { ItemCreatePanel } from '../../Layout/Panel/ItemCreatePanel';
import { UpgradeButton } from '../../Upsell/UpgradeButton';
import type { ItemNewViewProps } from '../../Views/types';
import { LoginEditCredentials } from './Login.edit.credentials';

const FORM_ID = 'new-login';

export const LoginNew: FC<ItemNewViewProps<'login'>> = ({ shareId, url: currentUrl, onCancel, onSubmit }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { needsUpgrade } = useSelector(selectTOTPLimits);

    const history = useHistory();
    const { ParentPortal, openPortal } = usePortal();

    const searchParams = useMemo(() => new URLSearchParams(history.location.search), []);
    const showUsernameField = useSelector(selectShowUsernameField);

    const initialValues = useInitialValues<LoginItemFormValues>((options) => {
        const clone = options?.clone.type === 'login' ? options.clone : null;
        const domain = currentUrl ? resolveSubdomain(currentUrl) : '';
        const domainWithPort = currentUrl ? (intoDomainWithPort({ ...currentUrl, domain }) ?? '') : '';
        const { url, valid } = sanitizeURL(domainWithPort);
        const currentUrlItem = !clone && valid ? [createNewUrlItem({ url, mode: AutofillMode.Default })] : [];

        return {
            aliasPrefix: '',
            aliasSuffix: undefined,
            extraFields: clone?.extraFields ?? [],
            files: filesFormInitializer(),
            itemEmail: clone?.content.itemEmail ?? searchParams.get('email') ?? '',
            itemUsername: clone?.content.itemUsername ?? '',
            mailboxes: [],
            name: clone?.metadata.name ?? domain ?? '',
            note: clone?.metadata.note ?? '',
            passkeys: [],
            password: clone?.content.password ?? '',
            shareId: options?.shareId ?? shareId,
            totpUri: clone?.content.totpUri ? getSecretOrUri(clone.content.totpUri) : '',
            url: '',
            urls: clone?.content.autofillUrls.map(createNewUrlItem) ?? currentUrlItem,
            editingUrlIndex: null,
            withAlias: false,
            withUsername: Boolean(clone?.content.itemUsername) || showUsernameField,
        };
    });

    const form = useFormik<LoginItemFormValues>({
        initialValues,
        onSubmit: async ({
            name,
            note,
            itemEmail,
            itemUsername,
            password,
            shareId,
            totpUri,
            url,
            urls,
            files,
            extraFields,
            ...values
        }) => {
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
                              aliasEmail: itemEmail,
                          },
                          extraFields: [],
                      },
                  }
                : { withAlias: false };

            const { email, username } = await getSanitizedUserIdentifiers({ itemEmail, itemUsername });
            const sanitizeOTP = bindOTPSanitizer(itemEmail, name);

            onSubmit({
                type: 'login',
                optimisticId,
                shareId,
                files,
                metadata: {
                    name,
                    note: obfuscate(note),
                    itemUuid: optimisticId,
                },
                content: {
                    itemEmail: obfuscate(email),
                    itemUsername: obfuscate(username),
                    password: obfuscate(password),
                    autofillUrls: fromItems(urls, url),
                    totpUri: pipe(sanitizeOTP, obfuscate)(totpUri),
                    passkeys: [],
                },
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
                extraData,
            });
        },
        validate: (values) => validateLoginForm({ values }),
        validateOnBlur: true,
        validateOnMount: true,
    });

    const alias = useAliasForLogin(form);
    const { aliasOptions } = alias;

    const draft = useItemDraft<LoginItemFormValues>(form, {
        type: 'login',
        mode: 'new',
        sanitizeSave: sanitizeLoginAliasSave,
        sanitizeHydration: sanitizeLoginAliasHydration(aliasOptions.value),
        onHydrated: (draft) => draft?.withAlias && aliasOptions.request(),
    });

    useEffect(() => {
        /** Removes the `email` parameter from URL on initial mount.
         * This prevents the email from persisting in browser history
         * when arriving from the 'create login from alias' flow */
        if (searchParams.has('email')) {
            searchParams.delete('email');
            history.replace({ search: searchParams.toString() });
        }
    }, []);

    return (
        <>
            <ItemCreatePanel
                type="login"
                formId={FORM_ID}
                valid={form.isValid && !form.status?.isBusy}
                handleCancelClick={onCancel}
                discardable={!form.dirty}
                actions={ParentPortal}
            >
                {({ didEnter }) => (
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                {vaultTotalCount > 1 &&
                                    openPortal(<Field component={VaultPickerField} name="shareId" dense />)}

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
                                <LoginEditCredentials form={form} alias={alias} />

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
                                <UrlGroupField initialTestUrl={currentUrl?.url ?? undefined} />
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
                                <Field name="files" component={FileAttachmentsField} shareId={form.values.shareId} />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                )}
            </ItemCreatePanel>
        </>
    );
};
