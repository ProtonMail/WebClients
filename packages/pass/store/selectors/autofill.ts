import {
    belongsToShares,
    hasOTP,
    hasUserIdentifier,
    isActive,
    isPasskeyItem,
    itemEq,
} from '@proton/pass/lib/items/item.predicates';
import type { PasskeyQueryPayload, SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import type { SelectAutofillCandidatesOptions, SelectOTPAutofillCandidateOptions } from '@proton/pass/lib/search/types';
import { isAutofillableShare } from '@proton/pass/lib/shares/share.predicates';
import { selectAllItems, selectItemsByType } from '@proton/pass/store/selectors/items';
import { selectVaultLimits } from '@proton/pass/store/selectors/limits';
import { createMatchDomainItemsSelector } from '@proton/pass/store/selectors/match';
import { selectAllShares } from '@proton/pass/store/selectors/shares';
import { selectPassPlan } from '@proton/pass/store/selectors/user';
import { NOOP_LIST_SELECTOR, createUncachedSelector } from '@proton/pass/store/selectors/utils';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionWithOptimistic, ShareId } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { deduplicate } from '@proton/pass/utils/array/duplicate';
import { prop } from '@proton/pass/utils/fp/lens';
import { and } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { parseUrl } from '@proton/pass/utils/url/parser';

export const selectAutofillableShareIDs = createUncachedSelector(
    [selectAllShares, selectVaultLimits, selectPassPlan, (_: State, writableFilter?: boolean) => writableFilter],
    (shares, { didDowngrade }, plan, writableFilter): ShareId[] => {
        const writableOnly = writableFilter || didDowngrade || plan === UserPassPlan.FREE;
        return shares.filter((share) => isAutofillableShare(share, writableOnly)).map(prop('shareId'));
    }
);

export const selectAutofillIdentityCandidates = (shareIds?: string[]) =>
    createUncachedSelector(selectItemsByType('identity'), (items) =>
        items.filter(and(isActive, belongsToShares(shareIds))).sort(sortOn('lastUseTime'))
    );

/** Autofill candidates resolution strategy : If we have a match on the subdomain :
 * return the subdomain matches first, then the top-level domain matches and finally
 * the other subdomain matches excluding any previously matched direct subdomain matches.
 * If we have no subdomain : return all matches (top level and other possible subdomain
 * matches) with top-level domain matches first. Pushes subdomain matches on top */
export const selectAutofillLoginCandidates = ({
    domain,
    subdomain,
    port,
    isPrivate,
    isSecure,
    protocol,
    shareIds,
    strict,
}: SelectAutofillCandidatesOptions) =>
    domain === null
        ? NOOP_LIST_SELECTOR<ItemRevisionWithOptimistic<'login'>>
        : createUncachedSelector(
              [
                  createMatchDomainItemsSelector(domain, {
                      isPrivate,
                      port,
                      protocol: !isSecure && protocol ? protocol : null,
                      shareIds,
                      sortOn: 'priority',
                      strict,
                  }),
                  createMatchDomainItemsSelector(subdomain ?? '', {
                      isPrivate,
                      port,
                      protocol: !isSecure && protocol ? protocol : null,
                      shareIds,
                      sortOn: 'lastUseTime',
                      strict,
                  }),
              ],
              (domainMatches, subdomainMatches) => deduplicate(subdomainMatches.concat(domainMatches), itemEq)
          );

export const selectOTPCandidate = ({ submission, ...options }: SelectOTPAutofillCandidateOptions) =>
    createUncachedSelector(selectAutofillLoginCandidates({ ...options, strict: true }), (candidates) => {
        const otpItems = candidates.filter(hasOTP);
        const userIdentifier = submission?.data.userIdentifier;

        if (userIdentifier) return otpItems.find(hasUserIdentifier(userIdentifier));
        else return otpItems.sort(sortOn('lastUseTime'))[0];
    });

export const selectPasskeys = (payload: PasskeyQueryPayload) =>
    createUncachedSelector(selectAllItems, (items): SelectedPasskey[] => {
        const { credentialIds } = payload;
        const { domain } = parseUrl(payload.domain);

        return domain
            ? items
                  .filter((item): item is ItemRevision<'login'> => isActive(item) && isPasskeyItem(item.data))
                  .flatMap((item) =>
                      (item.data.content.passkeys ?? [])
                          .filter((passkey) => {
                              const passkeyDomain = parseUrl(passkey.domain).domain;

                              return (
                                  passkeyDomain &&
                                  domain === passkeyDomain &&
                                  (credentialIds.length === 0 || credentialIds.includes(passkey.credentialId))
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
