import { type FC, type ReactElement, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { Spotlight } from '@proton/components';
import { Icon } from '@proton/components/components/icon';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { PasswordField } from '@proton/pass/components/Form/Field/PasswordField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { AliasModal } from '@proton/pass/components/Item/Alias/Alias.modal';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { usePasswordContext } from '@proton/pass/components/Password/PasswordProvider';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useAliasForLoginModal } from '@proton/pass/hooks/useAliasForLoginModal';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import { type LoginItemFormValues, OnboardingMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { parseUrl } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';

import './Login.edit.credentials.scss';

type Props = {
    form: FormikContextType<LoginItemFormValues>;
    isNew?: boolean;
};

export const LoginEditCredentials: FC<Props> = ({ form, isNew = false }) => {
    const { onboardingCheck } = usePassCore();
    const usernameSplit = useFeatureFlag(PassFeature.PassUsernameSplit);
    const passwordContext = usePasswordContext();
    const { search } = useLocation();
    const history = useHistory();

    const searchParams = new URLSearchParams(search);

    const { aliasOptions, ...aliasModal } = useAliasForLoginModal(form);

    const [usernameExpanded, setUsernameExpanded] = useState(false);
    const [showUsernameOnboarding, setShowUsernameOnboarding] = useState(false);
    const [itemHasUsername, setItemHasUsername] = useState(false);
    const showUsername = usernameExpanded || itemHasUsername;

    const { acknowledge } = useSpotlight();

    const iconWithFeatureFlag = usernameSplit ? 'envelope' : 'user';
    const labelWithFeatureFlag = usernameSplit ? c('Label').t`Email` : c('Label').t`Username`;

    const handleAddUsernameClick = () => {
        setUsernameExpanded(true);
        if (showUsernameOnboarding) acknowledge(OnboardingMessage.USERNAME_TOOLTIP);
    };

    useEffect(() => {
        (async () => usernameSplit && (await onboardingCheck?.(OnboardingMessage.USERNAME_TOOLTIP)))()
            .then((show) => setShowUsernameOnboarding(Boolean(show)))
            .catch(noop);
    }, [usernameSplit]);

    useEffect(() => {
        if (form.values.itemUsername.length > 0) setItemHasUsername(true);

        return () => {
            if (!isNew) return;
            searchParams.delete('email');
            history.replace({ search: searchParams.toString() });
        };
    }, []);

    return (
        <>
            <Field
                name="itemEmail"
                label={(() => {
                    if (aliasModal.willCreate) return c('Label').t`Email (new alias)`;
                    if (aliasModal.relatedAlias) return c('Label').t`Email (alias)`;
                    return labelWithFeatureFlag;
                })()}
                placeholder={
                    usernameSplit ? c('Placeholder').t`Enter email` : c('Placeholder').t`Enter email or username`
                }
                component={TextField}
                itemType="login"
                icon={
                    <>
                        <Icon
                            name={aliasModal.usernameIsAlias ? 'alias' : iconWithFeatureFlag}
                            size={5}
                            className="mt-2"
                        />
                        {usernameSplit && !showUsername && (
                            <Spotlight
                                content={
                                    <>
                                        <div className="text-bold">{c('Info').t`Add a username field`}</div>
                                        <div className="color-weak">{c('Info')
                                            .t`Click here to add a field for a username.`}</div>
                                    </>
                                }
                                originalPlacement="bottom-start"
                                onClose={() => acknowledge(OnboardingMessage.USERNAME_TOOLTIP)}
                                show={showUsernameOnboarding}
                            >
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
                            </Spotlight>
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
            {showUsername && (
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
