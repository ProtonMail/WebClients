import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { FileAttachmentsField } from '@proton/pass/components/FileAttachments/FileAttachmentsField';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { UrlGroupField, createNewUrl } from '@proton/pass/components/Form/Field/UrlGroupField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { LoginEditCredentials } from '@proton/pass/components/Item/Login/Login.edit.credentials';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useInitialValues } from '@proton/pass/hooks/items/useInitialValues';
import { useAliasForLogin } from '@proton/pass/hooks/useAliasForLogin';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { bindOTPSanitizer, getSanitizedUserIdentifiers, sanitizeExtraField } from '@proton/pass/lib/items/item.utils';
import { sanitizeLoginAliasHydration, sanitizeLoginAliasSave } from '@proton/pass/lib/validation/alias';
import { validateLoginForm } from '@proton/pass/lib/validation/login';
import { selectShowUsernameField, selectTOTPLimits, selectVaultLimits } from '@proton/pass/store/selectors';
import type { LoginItemFormValues } from '@proton/pass/types';
import { type LoginWithAliasCreationDTO } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { sanitizeURL } from '@proton/pass/utils/url/sanitize';
import { intoDomainWithPort, resolveDomain } from '@proton/pass/utils/url/utils';

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
        const domain = currentUrl ? resolveDomain(currentUrl) : '';
        const domainWithPort = currentUrl ? (intoDomainWithPort({ ...currentUrl, domain }) ?? '') : '';
        const { url, valid } = sanitizeURL(domainWithPort);

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
            totpUri: clone?.content.totpUri ?? '',
            url: !clone && valid ? createNewUrl(url).url : '',
            urls: clone?.content.urls.map(createNewUrl) ?? [],
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
                    urls: Array.from(new Set(urls.map(({ url }) => url).concat(isEmptyString(url) ? [] : [url]))),
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
