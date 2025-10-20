import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { PassErrorCode, UnverifiedUserError } from '@proton/pass/lib/api/errors';
import { isDisabledAlias } from '@proton/pass/lib/items/item.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { aliasDetailsRequest, intKey, selectedItemKey, withKey } from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    AliasContactBlockDTO,
    AliasContactGetResponse,
    AliasContactInfoDTO,
    AliasContactNewDTO,
    AliasContactWithStatsGetResponse,
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
    MailboxDTO,
    MailboxDeleteDTO,
    MailboxEditDTO,
    MailboxVerifyDTO,
    MaybeNull,
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

export const requestAliasOptions = requestActionsFactory<ShareId, AliasOptions>('alias::options::get')({
    key: identity,
    failure: {
        prepare: (err, payload) => {
            /** mutate the API error code in order to identify this
             * specific error kind UI-side */
            const error = getApiError(err);
            const unverified = err instanceof UnverifiedUserError;
            if (unverified) error.code = PassErrorCode.UNVERIFIED_USER;

            /** Silence any `UnverifiedUserError` error codes to avoid any
             * notifications on the alias creation page for unverified users */
            return unverified
                ? { payload, error }
                : withNotification({
                      type: 'error',
                      text: c('Error').t`Requesting alias options failed`,
                      error,
                  })({ payload, error });
        },
    },
});

export const getAliasDetailsIntent = createAction(
    'alias::details::get::intent',
    (payload: { shareId: string; itemId: string; aliasEmail: string }) =>
        withRequest({ status: 'start', id: aliasDetailsRequest(payload.aliasEmail) })({ payload })
);

export const getAliasDetailsSuccess = createAction(
    'alias::details::get::success',
    withRequestSuccess((payload: AliasDetails) => withCache({ payload }))
);

export const getAliasDetailsFailure = createAction(
    'alias::details::get::failure',
    withRequestFailure((payload: { aliasEmail: string }, error: unknown) => ({ payload, error }))
);

export const aliasDetailsSync = createAction('alias::details::sync', (payload: { aliasEmail: string } & Partial<AliasDetails>) =>
    withCache({ payload })
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

export const aliasSyncPending = requestActionsFactory<void, { items: ItemRevision[]; shareId: string }>('alias::sync::pending')({});

export const aliasSyncStatus = requestActionsFactory<void, SlSyncStatusOutput, void>('alias::sync::status')({
    success: { config: { maxAge: UNIX_MINUTE, data: null, hot: true } },
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
                    text: isDisabledAlias(item)
                        ? c('Info').t`Alias successfully disabled. You will no longer receive emails sent to ${item.aliasEmail}`
                        : c('Info').t`Alias successfully enabled. You can now receive emails sent to ${item.aliasEmail}`,
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

export const getMailboxes = requestActionsFactory<void, UserMailboxOutput[]>('alias::mailboxes')();

export const createMailbox = requestActionsFactory<string, UserMailboxOutput>('alias::mailbox::create')({
    key: identity,
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to create new mailbox`,
                type: 'error',
                error,
            })({ payload: getApiError(error) }),
    },
});

export const validateMailbox = requestActionsFactory<MailboxVerifyDTO, UserMailboxOutput>('alias::mailbox::validate')({
    key: ({ mailboxID }: MailboxDTO) => String(mailboxID),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailbox successfully verified`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to verify email address`,
                type: 'error',
                error,
            })({ payload, error: getApiError(error) }),
    },
});

export const resendVerifyMailbox = requestActionsFactory<number, UserMailboxOutput>('alias::mailboxes::resend-verify')({
    key: intKey,
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Verification email sent. Please check your inbox to verify your mailbox`,
            })({ payload: data }),
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

export const deleteMailbox = requestActionsFactory<MailboxDeleteDTO, MailboxDeleteDTO>('alias::mailbox::delete')({
    key: ({ mailboxID }) => mailboxID.toString(),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailbox successfully deleted`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to delete the mailbox`,
                type: 'error',
                error,
            })({ payload, error: getApiError(error) }),
    },
});

export const editMailbox = requestActionsFactory<MailboxEditDTO, UserMailboxOutput>('alias::mailboxes::edit')({
    key: ({ mailboxID }: MailboxDTO) => mailboxID.toString(),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to change mailbox`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const cancelMailboxEdit = requestActionsFactory<number, number>('alias::mailboxes::cancel-edit')({
    key: intKey,
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailbox change successfully cancelled`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to cancel mailbox change`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const setDefaultMailbox = requestActionsFactory<MailboxDTO, UserAliasSettingsGetOutput>('alias::mailbox::set-default')({
    key: ({ mailboxID }) => mailboxID.toString(),
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Default mailbox successfully updated`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to set default mailbox`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const getAliasDomains = requestActionsFactory<void, UserAliasDomainOutput[]>('alias::domains')();

export const setDefaultAliasDomain = requestActionsFactory<MaybeNull<string>, UserAliasSettingsGetOutput>('alias::domain::set-default')({
    key: (domain) => domain ?? 'not-selected',
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Default domain successfully updated`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to update default domain`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const getCustomDomains = requestActionsFactory<void, CustomDomainOutput[]>('alias::custom-domains')();

export const createCustomDomain = requestActionsFactory<string, CustomDomainOutput>('alias::custom-domain::create')({
    key: identity,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to create domain`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const getCustomDomainInfo = requestActionsFactory<number, CustomDomainOutput>('alias::custom-domain::info')({
    key: intKey,
});

export const verifyCustomDomain = requestActionsFactory<
    { domainID: number; silent?: boolean },
    CustomDomainValidationOutput & { silent?: boolean }
>('alias::custom-domain::validate')({
    key: ({ domainID }) => intKey(domainID),
    success: {
        prepare: ({ silent, ...payload }) =>
            silent
                ? { payload }
                : withNotification({
                      type: payload.OwnershipVerified ? 'success' : 'warning',
                      text: (() => {
                          if (payload.OwnershipVerified) {
                              return payload.MxVerified
                                  ? c('Success')
                                        .t`Domain successfully verified. Your domain can start receiving emails and creating aliases`
                                  : c('Success').t`Domain ownership verified. You can now set up MX record.`;
                          } else {
                              return c('Error').t`Domain could not be verified. Please make sure you added the correct DNS records`;
                          }
                      })(),
                  })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to verify domain`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const deleteCustomDomain = requestActionsFactory<number, number>('alias::custom-domain::delete')({
    key: intKey,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Domain successfully deleted`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to delete domain`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const getCustomDomainSettings = requestActionsFactory<number, CustomDomainSettingsOutput>('alias::custom-domain::settings')({
    key: intKey,

    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to load domain settings.`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const updateCatchAll = requestActionsFactory<CatchAllDTO, CustomDomainSettingsOutput>('alias::custom-domain::settings::catch-all')({
    key: ({ domainID }) => String(domainID),
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: data.CatchAll
                    ? c('Success').t`Catch-all setting successfully enabled`
                    : c('Success').t`Catch-all setting successfully disabled`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to update catch-all setting.`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const updateCustomDomainDisplayName = requestActionsFactory<CustomDomainNameDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::name'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Display name successfully updated`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to update domain name.`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const updateRandomPrefix = requestActionsFactory<RandomPrefixDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::random-prefix'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: data.RandomPrefixGeneration
                    ? c('Success').t`Random prefix generation successfully enabled`
                    : c('Success').t`Random prefix generation successfully disabled`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to update random prefix generation setting.`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const updateCustomDomainMailboxes = requestActionsFactory<CustomDomainMailboxesDTO, CustomDomainSettingsOutput>(
    'alias::custom-domain::settings::mailboxes'
)({
    key: ({ domainID }) => String(domainID),
    success: {
        prepare: (data) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Mailboxes successfully updated`,
            })({ payload: data }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to update domain mailboxes.`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const aliasGetContactsList = requestActionsFactory<UniqueItem, AliasContactWithStatsGetResponse[]>('alias::contact::get-list')({
    key: selectedItemKey,
});

export const aliasGetContactInfo = requestActionsFactory<AliasContactInfoDTO, AliasContactGetResponse>('alias::contact::get-info')({
    key: (dto) => withKey(selectedItemKey(dto))(dto.contactId),
});

export const aliasCreateContact = requestActionsFactory<AliasContactNewDTO, AliasContactGetResponse>('alias::contact::create')({
    key: (dto) => withKey(selectedItemKey(dto))(dto.email),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Contact successfully created`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to create the contact`,
                type: 'error',
                error,
            })({ payload }),
    },
});

export const aliasDeleteContact = requestActionsFactory<AliasContactInfoDTO, number>('alias::contact::delete')({
    key: (dto) => withKey(selectedItemKey(dto))(dto.contactId),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Success').t`Contact successfully deleted`,
            })({ payload }),
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

export const aliasBlockContact = requestActionsFactory<AliasContactBlockDTO, AliasContactGetResponse>('alias::contact::block')({
    key: (dto) => withKey(selectedItemKey(dto))(dto.contactId),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: payload.Blocked ? c('Success').t`Contact successfully blocked` : c('Success').t`Contact successfully unblocked`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to block the contact`,
                type: 'error',
                error,
            })({ payload }),
    },
});
