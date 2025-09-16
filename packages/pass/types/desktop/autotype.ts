import type { IconName } from '@proton/components/components/icon/Icon';
import type { WithSpotlightRenderProps } from '@proton/pass/components/Spotlight/WithSpotlight';
import type { ReactNode } from 'react';

export type AutotypeProperties = { fields: string[]; enterAtTheEnd?: boolean };

export type AutotypeConfirmProps = { autotypeProps: AutotypeProperties; spotlightToClose: WithSpotlightRenderProps };

export enum AutotypeKey {
    USERNAME_TAB_PASSWORD_ENTER = 'autotype-username-tab-password-enter',
    USERNAME_TAB_PASSWORD = 'autotype-username-tab-password',
    EMAIL_TAB_PASSWORD_ENTER = 'autotype-email-tab-password-enter',
    EMAIL_TAB_PASSWORD = 'autotype-email-tab-password',
    USERNAME_ENTER = 'autotype-username-enter',
    EMAIL_ENTER = 'autotype-email-enter',
    PASSWORD_ENTER = 'autotype-password-enter',
}

export type AutotypeAction = {
    getAutotypeProps: () => AutotypeProperties;
    key: AutotypeKey;
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: IconName;
};
