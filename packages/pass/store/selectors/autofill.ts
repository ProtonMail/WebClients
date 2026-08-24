import { belongsToShares, hasOTP, hasUserIdentifier, isActive, isPasskeyItem } from '../../lib/items/item.predicates';
import type { PasskeyQueryPayload, SelectedPasskey } from '../../lib/passkeys/types';
import { isAutofillableShare } from '../../lib/shares/share.predicates';
import { searchItemsByDomain } from '../../lib/urls/search/match';
import type { SearchItemsByDomainOptions } from '../../lib/urls/types';
import { parseUrl } from '../../lib/urls/utils/parser';
import type { FormSubmission, ItemRevision, Maybe, ShareId } from '../../types';
import { PassFeature } from '../../types/api/features';
import { prop } from '../../utils/fp/lens';
import { and } from '../../utils/fp/predicates';
import { sortOn } from '../../utils/fp/sort';
import type { State } from '../types';
import { selectItemsFactory, selectVisibleItems } from './items';
import { selectVisibleShares } from './shares';
import { selectFeatureFlag } from './user';
import { createUncachedSelector } from './utils';

export const selectAutofillableShareIDs = createUncachedSelector(
    [selectVisibleShares, (_: State, writableOnly?: boolean) => writableOnly],
    (shares, writableOnly = false): ShareId[] => shares.filter((share) => isAutofillableShare(share, writableOnly)).map(prop('shareId'))
);

export const selectAutofillIdentityCandidates = (shareIds?: string[]) =>
    createUncachedSelector(selectItemsFactory('identity', true), (items) =>
        items.filter(and(isActive, belongsToShares(shareIds))).sort(sortOn('lastUseTime'))
    );

export const selectAutofillCCCandidates = (shareIds?: string[]) =>
    createUncachedSelector(selectItemsFactory('creditCard', true), (items) =>
        items.filter(and(isActive, belongsToShares(shareIds))).sort(sortOn('lastUseTime'))
    );

/** Autofill candidates resolution strategy : If we have a match on the subdomain :
 * return the subdomain matches first, then the top-level domain matches and finally
 * the other subdomain matches excluding any previously matched direct subdomain matches.
 * If we have no subdomain : return all matches (top level and other possible subdomain
 * matches) with top-level domain matches first. Pushes subdomain matches on top */
export const selectAutofillLoginCandidates = (url: Maybe<string>, options: SearchItemsByDomainOptions) =>
    createUncachedSelector(
        [() => url, selectVisibleItems, () => options, selectFeatureFlag(PassFeature.PassAutofillUrlRegex)],
        (url, items, options, regexEnabled) => searchItemsByDomain(url, items, { ...options, regexEnabled })
    );

export const selectOTPCandidate = (url: Maybe<string>, submission?: FormSubmission, options?: SearchItemsByDomainOptions) =>
    createUncachedSelector(selectAutofillLoginCandidates(url, { ...options, strict: true }), (candidates) => {
        const otpItems = candidates.filter(hasOTP);
        const userIdentifier = submission?.data.userIdentifier;

        if (userIdentifier) return otpItems.find(hasUserIdentifier(userIdentifier));
        else return otpItems.sort(sortOn('lastUseTime'))[0];
    });

export const selectPasskeys = (payload: PasskeyQueryPayload) =>
    createUncachedSelector(selectVisibleItems, (items): SelectedPasskey[] => {
        const { domain } = parseUrl(payload.domain);
        const credentialIds = payload.credentialIds.map((id) => new Uint8Array(id).toBase64());

        return domain
            ? items
                  .filter((item): item is ItemRevision<'login'> => isActive(item) && isPasskeyItem(item.data))
                  .flatMap((item) =>
                      (item.data.content.passkeys ?? [])
                          .filter((passkey) => {
                              const passkeyDomain = parseUrl(passkey.domain).domain;
                              const credentialId = passkey.credentialId;

                              return (
                                  passkeyDomain &&
                                  domain === passkeyDomain &&
                                  (credentialIds.length === 0 || credentialIds.includes(credentialId))
                              );
                          })
                          .map((passkey) => ({
                              credentialId: passkey.credentialId,
                              itemId: item.itemId,
                              name: item.data.metadata.name,
                              shareId: item.shareId,
                              username: passkey.userName,
                          }))
                  )
            : [];
    });
