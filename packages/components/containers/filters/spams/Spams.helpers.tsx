import { c } from 'ttag';

import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';

import { SpamItem, SpamListAction, SpamListActionName, SpamLocation } from './Spams.interfaces';

export const isSpamDomain = (item: SpamItem) => 'domain' in item;
export const isSpamEmail = (item: SpamItem) => 'email' in item;

type ApiCallState = 'success' | 'fail';
export const getNotificationByAction = (action: SpamListActionName, apiCallstate: ApiCallState, item: SpamItem) => {
    const isDomain = 'domain' in item;
    const name = isDomain ? item.domain : item.email;

    const translationsMap: Record<SpamListActionName, Record<ApiCallState, string>> = {
        block: {
            fail: isDomain
                ? c('Domain spam notification').t`${name} failed to move to block list`
                : c('Email spam notification').t`${name} failed to move to block list`,
            success: isDomain
                ? c('Domain spam notification').t`${name} moved to block list`
                : c('Email spam notification').t`${name} moved to block list`,
        },
        delete: {
            fail: isDomain
                ? c('Domain spam notification').t`${name} deletion failed`
                : c('Email spam notification').t`${name} deletion failed`,
            success: isDomain
                ? c('Domain spam notification').t`${name} successfully deleted`
                : c('Email spam notification').t`${name} successfully deleted`,
        },
        spam: {
            fail: isDomain
                ? c('Domain spam notification').t`${name} failed to move to spam list`
                : c('Email spam notification').t`${name} failed to move to spam list`,
            success: isDomain
                ? c('Domain spam notification').t`${name} moved to spam list`
                : c('Email spam notification').t`${name} moved to spam list`,
        },
        unspam: {
            fail: isDomain
                ? c('Domain spam notification').t`${name} failed to move to allow list`
                : c('Email spam notification').t`${name} failed to move to allow list`,
            success: isDomain
                ? c('Domain spam notification').t`${name} moved to allow list`
                : c('Email spam notification').t`${name} moved to allow list`,
        },
    };

    return translationsMap[action][apiCallstate];
};

export type HandleSpamListActionClick = (type: SpamListActionName, item: SpamItem) => void;
export const getActionsByLocation = (item: SpamItem, onClick: HandleSpamListActionClick): SpamListAction[] => {
    const actions: Record<SpamListActionName, SpamListAction> = {
        block: { name: c('Action').t`Block`, onClick: () => onClick('block', item) },
        delete: { name: c('Action').t`Delete`, onClick: () => onClick('delete', item) },
        spam: { name: c('Action').t`Spam`, onClick: () => onClick('spam', item) },
        unspam: { name: c('Action').t`Allow`, onClick: () => onClick('unspam', item) },
    };

    switch (item.location) {
        case 'BLOCKED':
            return [actions.spam, actions.unspam, actions.delete];
        case 'SPAM':
            return [actions.block, actions.unspam, actions.delete];
        case 'NON_SPAM':
            return [actions.spam, actions.block, actions.delete];
        default:
            throw new Error('Invalid use case');
    }
};

export const getLabelByLocation = (location: SpamLocation): { name: string; color: string } => {
    switch (location) {
        case 'BLOCKED':
            return { name: c('Label').t`Block`, color: ACCENT_COLORS_MAP.purple.color };
        case 'NON_SPAM':
            return { name: c('Label').t`Allow`, color: ACCENT_COLORS_MAP.reef.color };
        case 'SPAM':
            return { name: c('Label').t`Spam`, color: ACCENT_COLORS_MAP.carrot.color };
        default:
            throw new Error('Invalid use case');
    }
};
