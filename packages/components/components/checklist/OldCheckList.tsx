import type { CSSProperties } from 'react';

import { c } from 'ttag';

import CheckListItem from './CheckListItem';

interface CheckListItemProps {
    smallVariant?: boolean;
    done?: boolean;
    style?: CSSProperties;
    onClick?: () => void;
    'data-testid'?: string;
}

export const OldCheckListImportMail = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    'data-testid': dataTestId,
}: CheckListItemProps) => (
    <CheckListItem
        text={
            smallVariant
                ? c('Get started checklist instructions').t`Import data`
                : c('Get started checklist instructions').t`Import contacts or emails`
        }
        onClick={onClick}
        smallVariant={smallVariant}
        style={style}
        done={done}
        data-testid={dataTestId}
    />
);

export const OldCheckListMobileStores = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    'data-testid': dataTestId,
}: CheckListItemProps) => (
    <CheckListItem
        text={c('Get started checklist instructions').t`Get mobile app`}
        onClick={onClick}
        smallVariant={smallVariant}
        style={style}
        done={done}
        data-testid={dataTestId}
    />
);

export const OldCheckListSendMessage = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    'data-testid': dataTestId,
}: CheckListItemProps) => (
    <CheckListItem
        text={c('Get started checklist instructions').t`Send a message`}
        onClick={onClick}
        smallVariant={smallVariant}
        style={style}
        done={done}
        data-testid={dataTestId}
    />
);

export const OldCheckListRecoveryMethod = ({
    smallVariant = false,
    onClick,
    done = false,
    style,
    'data-testid': dataTestId,
}: CheckListItemProps) => (
    <CheckListItem
        text={c('Get started checklist instructions').t`Set recovery method`}
        onClick={onClick}
        smallVariant={smallVariant}
        style={style}
        done={done}
        data-testid={dataTestId}
    />
);
