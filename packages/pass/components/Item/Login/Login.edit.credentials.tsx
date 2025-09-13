import type { FC, ReactElement } from 'react';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { PasswordField } from '@proton/pass/components/Form/Field/PasswordField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { AliasModal } from '@proton/pass/components/Item/Alias/Alias.modal';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { usePasswordHistoryActions } from '@proton/pass/components/Password/PasswordHistoryActions';
import type { AliasForLoginProps } from '@proton/pass/hooks/useAliasForLogin';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import type { LoginItemFormValues } from '@proton/pass/types';
import { merge, withMerge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { intoCleanHostname } from '@proton/pass/utils/url/utils';

import './Login.edit.credentials.scss';

type Props = {
    form: FormikContextType<LoginItemFormValues>;
    alias: AliasForLoginProps;
};

export const LoginEditCredentials: FC<Props> = ({ form, alias }) => {
    const { aliasOptions, ...aliasModal } = alias;
    const passwordHistory = usePasswordHistoryActions();

    const { itemEmail, withUsername } = form.values;
    const itemEmailFieldIcon = withUsername ? 'envelope' : 'user';

    /** When enabling the username field set the `itemEmail` as
     * the `itemUsername` only if it's a non-valid email */
    const handleAddUsernameClick = async () =>
        form.setValues(
            withMerge<LoginItemFormValues>({
                withUsername: true,
                ...(!(await PassUI.is_email_valid(itemEmail))
                    ? {
                          itemEmail: '',
                          itemUsername: itemEmail,
                      }
                    : {}),
            })
        );

    return (
        <>
            <Field
                name="itemEmail"
                label={(() => {
                    if (aliasModal.willCreate) return c('Label').t`Email (new alias)`;
                    if (aliasModal.relatedAlias) return c('Label').t`Email (alias)`;
                    return withUsername ? c('Label').t`Email` : c('Label').t`Email or username`;
                })()}
                placeholder={withUsername ? c('Placeholder').t`Enter email` : c('Label').t`Enter email or username`}
                component={TextField}
                itemType="login"
                icon={
                    <>
                        <Icon
                            name={aliasModal.usernameIsAlias ? 'alias' : itemEmailFieldIcon}
                            size={4}
                            className="mt-2"
                        />
                        {!withUsername && (
                            <ButtonLike
                                as="div"
                                icon
                                pill
                                size="small"
                                onClick={handleAddUsernameClick}
                                shape="solid"
                                title={c('Action').t`Add username field`}
                                className="pass-username-add-button absolute top-custom left-custom flex items-center justify-center relative pr-4"
                                style={{
                                    '--top-custom': '8px',
                                    '--left-custom': '16px',
                                }}
                            >
                                <Icon name="plus" size={4} className="shrink-0" />
                            </ButtonLike>
                        )}
                    </>
                }
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
            {withUsername && (
                <Field
                    name="itemUsername"
                    label={c('Label').t`Username`}
                    placeholder={c('Placeholder').t`Enter username`}
                    component={TextField}
                    icon="user"
                />
            )}
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
                    const origin = intoCleanHostname(baseUrl);
                    passwordHistory.add({ value, origin });
                }}
            />

            <AliasModal
                form={form}
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
