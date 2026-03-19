import type { CSSProperties } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useSettingsLink } from '@proton/components/index';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import appStoreSmall from '@proton/styles/assets/img/illustrations/checklist-app-store-small.svg';
import byoeImg from '@proton/styles/assets/img/illustrations/checklist-byoe.svg';
import gmailForwardSmall from '@proton/styles/assets/img/illustrations/checklist-gmail-forward-small.svg';
import protectInboxSmall from '@proton/styles/assets/img/illustrations/checklist-protect-inbox-small.svg';
import { useFlag } from '@proton/unleash/useFlag';

import CheckListItem from './CheckListItem';

interface CheckListItemProps {
    done?: boolean;
    disabled?: boolean;
    style?: CSSProperties;
    onClick?: () => void | Promise<void>;
    'data-testid'?: string;
}

export const CheckListProtectInbox = ({
    onClick,
    done = false,
    style,
    disabled = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    return (
        <CheckListItem
            icon={protectInboxSmall}
            text={c('Get started checklist instructions').t`Discover privacy features`}
            onClick={onClick}
            style={style}
            done={done}
            disabled={disabled}
            data-testid={dataTestId}
        />
    );
};

export const CheckListReviewImports = ({
    onClick,
    done = false,
    style,
    disabled = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    const isInMaintenance = useFlag('MaintenanceImporter');
    const goToSettings = useSettingsLink();

    const item = (
        <CheckListItem
            icon={gmailForwardSmall}
            text={c('Get started checklist instructions').t`Review import options`}
            onClick={async () => {
                await onClick?.();
                goToSettings('/easy-switch', APPS.PROTONMAIL);
            }}
            style={style}
            done={done}
            disabled={disabled || isInMaintenance}
            data-testid={dataTestId}
        />
    );

    if (isInMaintenance) {
        return (
            <Tooltip title={c('Get started checklist instructions').t`This feature is currently unavailable`}>
                <div>{item}</div>
            </Tooltip>
        );
    }

    return item;
};

export const CheckListClaimProtonAddress = ({
    onClick,
    done = false,
    style,
    disabled = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    const text = c('Get started checklist instructions').t`Claim ${BRAND_NAME} address`;

    return (
        <CheckListItem
            icon={byoeImg}
            text={text}
            onClick={onClick}
            style={style}
            done={done}
            disabled={disabled}
            data-testid={dataTestId}
        />
    );
};

export const CheckListMobileStores = ({
    onClick,
    done = false,
    style,
    disabled = false,
    'data-testid': dataTestId,
}: CheckListItemProps) => {
    return (
        <CheckListItem
            icon={appStoreSmall}
            text={c('Get started checklist instructions').t`Download apps`}
            onClick={onClick}
            style={style}
            done={done}
            disabled={disabled}
            data-testid={dataTestId}
        />
    );
};
