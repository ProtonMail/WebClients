import type { CSSProperties } from 'react';

import { c } from 'ttag';

import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import accountLoginSmall from '@proton/styles/assets/img/illustrations/checklist-account-login-small.svg';
import accountLogin from '@proton/styles/assets/img/illustrations/checklist-account-login.svg';
import appStoreSmall from '@proton/styles/assets/img/illustrations/checklist-app-store-small.svg';
import appStore from '@proton/styles/assets/img/illustrations/checklist-app-store.svg';
import gmailForwardSmall from '@proton/styles/assets/img/illustrations/checklist-gmail-forward-small.svg';
import gmailForward from '@proton/styles/assets/img/illustrations/checklist-gmail-forward.svg';
import protectInboxSmall from '@proton/styles/assets/img/illustrations/checklist-protect-inbox-small.svg';
import protectInbox from '@proton/styles/assets/img/illustrations/checklist-protect-inbox.svg';

import CheckListItem from './CheckListItem';

interface CheckListItemProps {
    smallVariant?: boolean;
    done?: boolean;
    disabled?: boolean;
    style?: CSSProperties;
    onClick?: () => void;
    alwaysClickable?: boolean;
    'data-testid'?: string;
}

export const CheckListProtectInbox = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    disabled = false,
    alwaysClickable = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    // translator: This text is in bold inside the sentence "Protect your inbox with our privacy features"
    const strongText = <strong>{c('Get started checklist instructions').t`Protect your inbox`}</strong>;
    // translator: The whole sentence is "Protect your inbox with our privacy features"
    const text = c('Get started checklist instructions').jt`${strongText} with our privacy features`;
    const smallText = c('Get started checklist instructions').t`Discover privacy features`;

    return (
        <CheckListItem
            largeIcon={protectInbox}
            smallIcon={protectInboxSmall}
            text={smallVariant ? smallText : text}
            onClick={onClick}
            smallVariant={smallVariant}
            style={style}
            done={done}
            disabled={disabled}
            alwaysClickable={alwaysClickable}
            data-testid={dataTestId}
        />
    );
};

export const CheckListGmailForward = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    disabled = false,
    alwaysClickable = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    // translator: This text is in bold inside the sentence "Set up auto-forwarding from Gmail"
    const strongText = <strong>{c('Get started checklist instructions').t`auto-forwarding`}</strong>;
    // translator: The whole sentence is "Set up auto-forwarding from Gmail"
    const text = c('Get started checklist instructions').jt`Set up ${strongText} from Gmail`;
    const smallText = c('Get started checklist instructions').t`Auto-forward Gmail`;

    return (
        <CheckListItem
            largeIcon={gmailForward}
            smallIcon={gmailForwardSmall}
            text={smallVariant ? smallText : text}
            onClick={onClick}
            smallVariant={smallVariant}
            style={style}
            done={done}
            disabled={disabled}
            alwaysClickable={alwaysClickable}
            data-testid={dataTestId}
        />
    );
};

export const CheckListAccountLogin = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    disabled = false,
    alwaysClickable = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    // translator: This text is in bold inside the sentence "Change account logins to your Proton address"
    const strongText = <strong>{c('Get started checklist instructions').t`account logins`}</strong>;
    // translator: The whole sentence is "Change account logins to your Proton address"
    const text = c('Get started checklist instructions').jt`Change ${strongText} to your ${BRAND_NAME} address`;
    const smallText = c('Get started checklist instructions').t`Update your logins`;

    return (
        <CheckListItem
            largeIcon={accountLogin}
            smallIcon={accountLoginSmall}
            text={smallVariant ? smallText : text}
            onClick={onClick}
            smallVariant={smallVariant}
            style={style}
            done={done}
            disabled={disabled}
            alwaysClickable={alwaysClickable}
            data-testid={dataTestId}
        />
    );
};

export const CheckListMobileStores = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    disabled = false,
    alwaysClickable = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    const googleLink = <strong>Android</strong>;
    const appleLink = <strong>iOS</strong>;
    // translator: The whole sentence is "Get the ProtonMail app on Google Play or App Store", where "Google Play" and "App Store" are links and bold
    const text = c('Get started checklist instructions')
        .jt`Get the ${MAIL_APP_NAME} app on ${googleLink} or ${appleLink}`;
    const smallText = c('Get started checklist instructions').t`Get the App`;

    return (
        <CheckListItem
            largeIcon={appStore}
            smallIcon={appStoreSmall}
            text={smallVariant ? smallText : text}
            onClick={onClick}
            smallVariant={smallVariant}
            style={style}
            done={done}
            disabled={disabled}
            alwaysClickable={alwaysClickable}
            data-testid={dataTestId}
        />
    );
};
