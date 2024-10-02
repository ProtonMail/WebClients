import { type FC, type ReactElement, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

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
import { usePasswordContext } from '@proton/pass/components/Password/PasswordContext';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import { type LoginItemFormValues } from '@proton/pass/types';
import { merge, withMerge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { intoCleanHostname } from '@proton/pass/utils/url/utils';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import './Login.edit.credentials.scss';

type Props = {
    form: FormikContextType<LoginItemFormValues>;
    isNew?: boolean;
};

/**
 *
 * @param param0 If only email or username is available or nothing available at all:
No expansion
Populate the value under "Email or username" label
If both email and username are available:
Expand to separate "Email" and "Username" by default
Populate email under "Email" label
Populate username under "Username" label
 * @returns
 */

export const LoginEditCredentials: FC<Props> = ({ form, isNew = false }) => {
    const history = useHistory();
    const { search } = useLocation();
    const passwordContext = usePasswordContext();
    const { aliasOptions, ...aliasModal } = useAliasForLoginModal(form);

    const { itemEmail, itemUsername, withUsername } = form.values;

    const itemEmailFieldIcon = withUsername ? 'envelope' : 'user';

    /** When enabling the username field set the `itemEmail` as
     * the `itemUsername` only if it's a non-valid email */
    const handleAddUsernameClick = () =>
        form.setValues(
            withMerge<LoginItemFormValues>({
                withUsername: true,
                ...(!validateEmailAddress(itemEmail)
                    ? {
                          itemEmail: '',
                          itemUsername: itemEmail,
                      }
                    : {}),
            })
        );

    useEffect(() => {
        /** On mount, if username field is not expanded, use the `itemEmail` as
         * the virtual `Email or username` field value. This should be sanitized
         * on save by checking if the provided value is a valid email.  */
        if (!withUsername) {
            form.resetForm({
                values: {
                    ...form.values,
                    itemEmail: itemUsername || itemEmail,
                    itemUsername: '',
                },
            });
        }

        return () => {
            if (isNew) {
                const searchParams = new URLSearchParams(search);
                searchParams.delete('email');
                history.replace({ search: searchParams.toString() });
            }
        };
    }, []);

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
                            size={5}
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
                    passwordContext.history.add({ value, origin });
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
