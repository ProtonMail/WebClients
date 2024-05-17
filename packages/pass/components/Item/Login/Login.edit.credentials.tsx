import { type FC, type ReactElement, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { PasswordField } from '@proton/pass/components/Form/Field/PasswordField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { AliasModal } from '@proton/pass/components/Item/Alias/Alias.modal';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { usePasswordContext } from '@proton/pass/components/Password/PasswordProvider';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import type { LoginItemFormValues } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { parseUrl } from '@proton/pass/utils/url/parser';

type Props = {
    form: FormikContextType<LoginItemFormValues>;
    isNew?: boolean;
};

export const LoginEditCredentials: FC<Props> = ({ form, isNew = false }) => {
    const passwordContext = usePasswordContext();
    const { search } = useLocation();
    const history = useHistory();

    const searchParams = new URLSearchParams(search);

    const { aliasOptions, ...aliasModal } = useAliasForLoginModal(form);

    useEffect(
        () => () => {
            if (!isNew) return;
            searchParams.delete('email');
            history.replace({ search: searchParams.toString() });
        },
        []
    );

    return (
        <>
            <Field
                name="itemEmail"
                label={(() => {
                    if (aliasModal.willCreate) return c('Label').t`Email (new alias)`;
                    if (aliasModal.relatedAlias) return c('Label').t`Email (alias)`;
                    return c('Label').t`Email`;
                })()}
                placeholder={c('Placeholder').t`Enter email`}
                component={TextField}
                itemType="login"
                icon={aliasModal.usernameIsAlias ? 'alias' : 'envelope'}
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
                                                itemEmail: form.initialValues.itemEmail,
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

            <AliasModal
                form={form}
                shareId={form.values.shareId}
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
                                ? merge(values, { itemEmail: aliasPrefix! + aliasSuffix!.value })
                                : values;
                        })
                        .then<any>(() => form.setFieldTouched('aliasPrefix', true))
                        .finally(() => aliasModal.setOpen(false))
                }
            />
        </>
    );
};
