import { c } from 'ttag';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CLIENT_TYPES, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

export type OptionLabelItem = { type: 'label'; value: string };
export type OptionOptionItem = {
    type: 'option';
    title: string;
    value: string;
    clientType?: CLIENT_TYPES;
    app?: APP_NAMES;
};
export type OptionItem = OptionOptionItem | OptionLabelItem;

export const getMailOptions = ({ isAuthenticatorAvailable }: { isAuthenticatorAvailable: boolean }): OptionItem[] => {
    const optionType = 'option' as const;
    const labelType = 'label' as const;

    return [
        { type: labelType, value: c('Group').t`Account` },
        { type: optionType, value: 'Sign in problem', title: c('Bug category').t`Sign in problem` },
        { type: optionType, value: 'Sign up problem', title: c('Bug category').t`Sign up problem` },
        { type: optionType, value: 'Payments problem', title: c('Bug category').t`Payments problem` },
        { type: optionType, value: 'Custom domain problem', title: c('Bug category').t`Custom domain problem` },
        { type: labelType, value: c('Group').t`Apps` },
        { type: optionType, value: 'Bridge problem', title: c('Bug category').t`Bridge problem` },
        { type: optionType, value: 'Import / export problem', title: c('Bug category').t`Import / export problem` },
        { type: labelType, value: c('Group').t`Network` },
        { type: optionType, value: 'Connection problem', title: c('Bug category').t`Connection problem` },
        { type: optionType, value: 'Slow speed problem', title: c('Bug category').t`Slow speed problem` },
        { type: labelType, value: c('Group').t`Services` },
        {
            type: optionType,
            value: 'Calendar problem',
            title: c('Bug category').t`Calendar problem`,
            app: APPS.PROTONCALENDAR,
        },
        { type: optionType, value: 'Contacts problem', title: c('Bug category').t`Contacts problem` },
        {
            type: optionType,
            value: 'Drive problem',
            title: c('Bug category').t`Drive problem`,
            clientType: CLIENT_TYPES.DRIVE,
            app: APPS.PROTONDRIVE,
        },
        {
            type: optionType,
            value: 'Docs problem',
            title: c('Bug category').t`Docs problem`,
            app: APPS.PROTONDOCS,
        },
        {
            type: optionType,
            value: 'Sheets problem',
            title: c('Bug category').t`Sheets problem`,
            app: APPS.PROTONSHEETS,
        },
        {
            type: optionType,
            value: 'Mail problem',
            title: c('Bug category').t`Mail problem`,
            app: APPS.PROTONMAIL,
        },
        {
            type: optionType,
            value: 'VPN problem',
            title: c('Bug category').t`VPN problem`,
            clientType: CLIENT_TYPES.VPN,
            app: APPS.PROTONVPN_SETTINGS,
        },
        {
            type: optionType,
            value: 'Pass problem',
            title: c('Bug category').t`Pass problem`,
            clientType: CLIENT_TYPES.PASS,
            app: APPS.PROTONPASS,
        },
        {
            type: optionType,
            value: 'Wallet problem',
            title: c('wallet_signup_2024:Bug category').t`Wallet problem`,
            clientType: CLIENT_TYPES.WALLET,
            app: APPS.PROTONWALLET,
        },
        {
            type: optionType,
            value: 'Lumo problem',
            title: c('Bug category').t`${LUMO_SHORT_APP_NAME} problem`,
            clientType: CLIENT_TYPES.LUMO,
            app: APPS.PROTONLUMO,
        },
        {
            type: optionType,
            value: 'Meet problem',
            title: c('Bug category').t`Meet problem`,
            clientType: CLIENT_TYPES.MEET,
            app: APPS.PROTONMEET,
        },
        isAuthenticatorAvailable && {
            type: optionType,
            value: 'Authenticator problem',
            title: c('Bug category').t`Authenticator problem`,
            clientType: CLIENT_TYPES.AUTHENTICATOR,
            app: APPS.PROTONAUTHENTICATOR,
        },
        { type: labelType, value: c('Group').t`Other category` },
        { type: optionType, value: 'Feature request', title: c('Bug category').t`Feature request` },
        { type: optionType, value: 'Other', title: c('Bug category').t`Other` },
    ].filter(isTruthy);
};

export const getVPNOptions = (): OptionItem[] => {
    return [
        { type: 'option', value: 'Login problem', title: c('Bug category').t`Sign in problem` },
        { type: 'option', value: 'Signup problem', title: c('Bug category').t`Signup problem` },
        { type: 'option', value: 'Payments problem', title: c('Bug category').t`Payments problem` },
        { type: 'option', value: 'Installation problem', title: c('Bug category').t`Installation problem` },
        { type: 'option', value: 'Update problem', title: c('Bug category').t`Update problem` },
        { type: 'option', value: 'Application problem', title: c('Bug category').t`Application problem` },
        { type: 'option', value: 'Connection problem', title: c('Bug category').t`Connection problem` },
        { type: 'option', value: 'Speed problem', title: c('Bug category').t`Speed problem` },
        { type: 'option', value: 'Manual setup problem', title: c('Bug category').t`Manual setup problem` },
        { type: 'option', value: 'Website access problem', title: c('Bug category').t`Website access problem` },
        { type: 'option', value: 'Streaming problem', title: c('Bug category').t`Streaming problem` },
        { type: 'option', value: 'Feature request', title: c('Bug category').t`Feature request` },
    ];
};

export const findCategoryOption = (options: OptionItem[], category: string) =>
    options.find(
        (option): option is OptionOptionItem =>
            option.type === 'option' && option.value.toLowerCase() === category.toLowerCase()
    );

/**
 * Every category the Mail-side form can offer, as the untranslated values {@link findCategoryOption}
 * matches on. Exposed so a caller that pre-fills the form — the Lumo agent picks a category from this
 * list — tracks the form itself rather than a hand-copied duplicate. The Authenticator category is
 * included whatever its flag says: a value the form does not offer falls back to the form's default,
 * which is a safer miss than an incomplete list.
 */
export const getMailBugCategoryValues = (): string[] => {
    return getMailOptions({ isAuthenticatorAvailable: true })
        .filter((option): option is OptionOptionItem => option.type === 'option')
        .map(({ value }) => value);
};
