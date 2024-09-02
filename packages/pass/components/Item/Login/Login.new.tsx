import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

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
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import { sanitizeLoginAliasHydration, sanitizeLoginAliasSave } from '@proton/pass/lib/validation/alias';
import { validateLoginForm } from '@proton/pass/lib/validation/login';
import { selectTOTPLimits, selectVaultLimits } from '@proton/pass/store/selectors';
import type { LoginItemFormValues } from '@proton/pass/types';
import { type LoginWithAliasCreationDTO } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';

const FORM_ID = 'new-login';

export const LoginNew: FC<ItemNewViewProps<'login'>> = ({ shareId, url, onCancel, onSubmit }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { needsUpgrade } = useSelector(selectTOTPLimits);

    const { domain, subdomain } = url ?? {};
    const { search } = useLocation();
    const history = useHistory();
    const { ParentPortal, openPortal } = usePortal();

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
            itemEmail: searchParams.get('email') ?? '',
            itemUsername: '',
            withAlias: false,
        };
    }, []);

    const form = useFormik<LoginItemFormValues>({
        initialValues,
        initialErrors: validateLoginForm({ values: initialValues }),
        onSubmit: ({
            name,
            note,
            itemEmail,
            itemUsername,
            password,
            shareId,
            totpUri,
            url,
            urls,
            extraFields,
            ...values
        }) => {
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
                              aliasEmail: itemEmail,
                          },
                          extraFields: [],
                      },
                  }
                : { withAlias: false };

            const normalizedOtpUri = parseOTPValue(totpUri, {
                label: itemEmail || undefined,
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
                    itemEmail: obfuscate(itemEmail),
                    itemUsername: obfuscate(itemUsername),
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
                                          label: itemEmail || undefined,
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
        validate: (values) => validateLoginForm({ values }),
        validateOnBlur: true,
    });

    const { aliasOptions } = useAliasForLoginModal(form);

    const draft = useItemDraft<LoginItemFormValues>(form, {
        type: 'login',
        mode: 'new',
        sanitizeSave: sanitizeLoginAliasSave,
        sanitizeHydration: sanitizeLoginAliasHydration(aliasOptions.value),
        onHydrated: (draft) => draft?.withAlias && aliasOptions.request(),
    });

    useEffect(
        () => () => {
            searchParams.delete('email');
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
                                <LoginEditCredentials form={form} isNew />

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
        </>
    );
};
