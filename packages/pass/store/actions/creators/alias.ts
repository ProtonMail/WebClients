import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { ALIAS_DETAILS_MAX_AGE, ALIAS_OPTIONS_MAX_AGE } from '@proton/pass/constants';
import { isAliasDisabled } from '@proton/pass/lib/items/item.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { type ActionCallback, withCallback } from '@proton/pass/store/actions/enhancers/callback';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { aliasDetailsRequest, aliasOptionsRequest, selectedItemKey } from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    AliasContactBlockDTO,
    AliasContactGetResponse,
    AliasContactInfoDTO,
    AliasContactListResponse,
    AliasContactNewDTO,
    AliasDetails,
    AliasOptions,
    AliasToggleStatusDTO,
    CatchAllDTO,
    CustomDomainMailboxesDTO,
    CustomDomainNameDTO,
    CustomDomainOutput,
    CustomDomainSettingsOutput,
    CustomDomainValidationOutput,
    ItemRevision,
    MailboxDefaultDTO,
    MailboxDeleteDTO,
    RandomPrefixDTO,
    SelectedItem,
    ShareId,
    SlSyncStatusOutput,
    UniqueItem,
    UserAliasDomainOutput,
    UserAliasSettingsGetOutput,
    UserMailboxOutput,
} from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import identity from '@proton/utils/identity';

export const getAliasOptionsIntent = createAction(
    'alias::options::get::intent',
    (
        payload: { shareId: string },
        callback?: ActionCallback<ReturnType<typeof getAliasOptionsSuccess> | ReturnType<typeof getAliasOptionsFailure>>
    ) =>
        pipe(
            withRequest({ status: 'start', id: aliasOptionsRequest(payload.shareId) }),
            withCallback(callback)
        )({ payload })
);

export const getAliasOptionsSuccess = createAction(
    'alias::options::get::success',
    withRequestSuccess((payload: { options: AliasOptions }) => withCache({ payload }), {
        maxAge: ALIAS_OPTIONS_MAX_AGE,
    })
);

export const getAliasOptionsFailure = createAction(
    'alias::options::get::failure',
    withRequestFailure((error: unknown) =>
        withNotification({ type: 'error', text: c('Error').t`Requesting alias options failed`, error })({
            payload: {},
            error,
        })
    )
);

export const getAliasDetailsIntent = createAction(
    'alias::details::get::intent',
    (payload: { shareId: string; itemId: string; aliasEmail: string }) =>
        withRequest({ status: 'start', id: aliasDetailsRequest(payload.aliasEmail) })({ payload })
);

export const getAliasDetailsSuccess = createAction(
    'alias::details::get::success',
    withRequestSuccess((payload: AliasDetails) => withCache({ payload }), {
        maxAge: ALIAS_DETAILS_MAX_AGE,
    })
);

export const getAliasDetailsFailure = createAction(
    'alias::details::get::failure',
    withRequestFailure((payload: { aliasEmail: string }, error: unknown) => ({ payload, error }))
);

export const aliasDetailsSync = createAction(
    'alias::details::sync',
    (payload: { aliasEmail: string } & Partial<AliasDetails>) => withCache({ payload })
);

export const aliasSyncEnable = requestActionsFactory<ShareId, ShareId>('alias::sync::enable')({
    success: {
        prepare: (shareId) =>
            withNotification({
                text: c('Success').t`Aliases sync enabled successfully. SimpleLogin aliases may take some time to sync`,
                type: 'success',
            })({ payload: { shareId } }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to sync aliases`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const aliasSyncPending = requestActionsFactory<void, { items: ItemRevision[]; shareId: string }>(
    'alias::sync::pending'
)({});

export const aliasSyncStatus = requestActionsFactory<void, SlSyncStatusOutput, void>('alias::sync::status')({
    success: { config: { maxAge: UNIX_MINUTE } },
});

export const aliasSyncStatusToggle = requestActionsFactory<AliasToggleStatusDTO, SelectedItem & { item: ItemRevision }>(
    'alias::sync::status::toggle'
)({
    key: selectedItemKey,
    success: {
        prepare: ({ shareId, itemId, item }) =>
            pipe(
                withCache,
                withNotification({
                    type: 'info',
                    text: isAliasDisabled(item)
                        ? c('Info')
                              .t`Alias succcessfully disabled. You will no longer receive emails sent to ${item.aliasEmail}`
                        : c('Info')
                              .t`Alias succcessfully enabled. You can now receive emails sent to ${item.aliasEmail}`,
                })
            )({ payload: { shareId, itemId, item } }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Alias could not be updated at the moment. Please try again later`,
                error,
            })({ payload }),
    },
});

export const getMailboxes = requestActionsFactory<void, UserMailboxOutput[]>('alias::mailboxes')({
    success: { config: { data: true } },
});

export const createMailbox = requestActionsFactory<string, UserMailboxOutput>('alias::mailbox::create')({
    key: identity,
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to create new mailbox`,
                type: 'error',
                error,
            })({ payload: getApiError(error) }),
    },
});

export const validateMailbox = requestActionsFactory<{ mailboxID: number; code: string }, UserMailboxOutput>(
    'alias::mailbox::validate'
)({
    key: ({ mailboxID }) => String(mailboxID),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailbox successfully verified`,
            })({ payload }),
        config: { data: true },
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to verify email address`,
                type: 'error',
                error,
            })({ payload: getApiError(error) }),
        config: { data: true },
    },
});

export const resendVerifyMailbox = requestActionsFactory<number, UserMailboxOutput>('alias::mailboxes::resend-verify')({
    key: String,
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Verification email sent. Please check your inbox to verify your mailbox`,
            })({ payload: data }),
        config: { data: true },
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to resend verification code`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const deleteMailbox = requestActionsFactory<MailboxDeleteDTO, Boolean>('alias::mailbox::delete')({
    key: ({ mailboxID }) => mailboxID.toString(),
    success: {
        prepare: () =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailbox successfully deleted`,
            })({ payload: {} }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to delete the mailbox`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const setDefaultMailbox = requestActionsFactory<MailboxDefaultDTO, UserAliasSettingsGetOutput>(
    'alias::mailbox::set-default'
)({
    key: ({ defaultMailboxID }) => defaultMailboxID.toString(),
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Default mailbox successfully updated`,
            })({ payload: data }),
        config: { data: true },
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to set default mailbox default`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const getAliasDomains = requestActionsFactory<void, UserAliasDomainOutput[]>('alias::domains')({
    success: { config: { data: true } },
});

export const setDefaultAliasDomain = requestActionsFactory<string, UserAliasSettingsGetOutput>(
    'alias::domain::set-default'
)({
    key: identity,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Default domain successfully updated`,
            })({ payload }),
        config: { data: true },
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to update default domain`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const getCustomDomains = requestActionsFactory<void, CustomDomainOutput[]>('alias::custom-domains')({
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { data: true },
    },
});

export const createCustomDomain = requestActionsFactory<string, CustomDomainOutput>('alias::custom-domain::create')({
    key: identity,
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to create domain`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const getCustomDomainInfo = requestActionsFactory<number, CustomDomainOutput>('alias::custom-domain::info')({
    key: String,
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { data: true },
    },
});

export const verifyCustomDomain = requestActionsFactory<number, CustomDomainValidationOutput>(
    'alias::custom-domain::validate'
)({
    key: String,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: (() => {
                    if (payload.OwnershipVerified && payload.MxVerified) {
                        return c('Success')
                            .t`Domain successfully verified. Your domain can start receiving emails and creating aliases`;
                    } else if (payload.OwnershipVerified && !payload.MxVerified) {
                        return c('Success').t`Domain ownership verified. You can now set up MX record.`;
                    } else {
                        return c('Error')
                            .t`Domain could not be verified. Please make sure you added the correct DNS records`;
                    }
                })(),
            })({ payload }),
        config: { data: true },
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to verify domain`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const deleteCustomDomain = requestActionsFactory<number, Boolean>('alias::custom-domain::delete')({
    key: String,
    success: {
        prepare: () =>
            withNotification({
                type: 'success',
                text: c('Success').t`Domain successfully deleted`,
            })({ payload: {} }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to delete domain`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const getCustomDomainSettings = requestActionsFactory<number, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings'
)({
    key: String,
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to load domain settings.`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const updateCatchAll = requestActionsFactory<CatchAllDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::catch-all'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        config: { data: true },
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: data.CatchAll
                    ? c('Success').t`Catch-all setting successfully enabled`
                    : c('Success').t`Catch-all setting successfully disabled`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to update catch-all setting.`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const updateCustomDomainDisplayName = requestActionsFactory<CustomDomainNameDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::name'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        config: { data: true },
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Display name successfully updated`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to update domain name.`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const updateRandomPrefix = requestActionsFactory<RandomPrefixDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::random-prefix'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        config: { data: true },
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: data.RandomPrefixGeneration
                    ? c('Success').t`Random prefix generation successfully enabled`
                    : c('Success').t`Random prefix generation successfully disabled`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to update random prefix generation setting.`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const updateCustomDomainMailboxes = requestActionsFactory<CustomDomainMailboxesDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::mailboxes'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        config: { data: true },
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailboxes successfully updated`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to update domain mailboxes.`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const aliasGetContactsList = requestActionsFactory<UniqueItem, AliasContactListResponse>(
    'alias::contact::get-list'
)({
    key: selectedItemKey,
    success: {
        config: { data: true },
    },
});

export const aliasGetContactInfo = requestActionsFactory<AliasContactInfoDTO, AliasContactGetResponse>(
    'alias::contact::get-info'
)({
    key: selectedItemKey,
    success: {
        config: { data: true },
    },
});

export const aliasCreateContact = requestActionsFactory<AliasContactNewDTO, boolean>('alias::contact::create')({
    key: selectedItemKey,
    success: {
        prepare: () =>
            withNotification({
                type: 'success',
                text: c('Success').t`Contact successfully created`,
            })({ payload: {} }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to create the contact`,
                type: 'error',
                error,
            })({ payload: {} }),
    },
});

export const aliasDeleteContact = requestActionsFactory<AliasContactInfoDTO, boolean>('alias::contact::delete')({
    key: selectedItemKey,
    success: {
        prepare: () =>
            withNotification({
                type: 'success',
                text: c('Success').t`Contact successfully deleted`,
            })({ payload: {} }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to delete the contact`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const aliasBlockContact = requestActionsFactory<AliasContactBlockDTO, boolean>('alias::contact::block')({
    key: selectedItemKey,
    success: {
        prepare: (blocked) =>
            withNotification({
                type: 'success',
                text: blocked
                    ? c('Success').t`Contact successfully blocked`
                    : c('Success').t`Contact successfully unblocked`,
            })({ payload: {} }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to block the contact`,
                type: 'error',
                error,
            })({ payload: {} }),
    },
});
