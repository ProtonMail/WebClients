import { c } from 'ttag';

import { useFlag } from '@proton/unleash/useFlag';

import { isSearch } from '../../../helpers/elements';
import { selectSearch } from '../../../store/elements/elementsSelectors';
import { useMailSelector } from '../../../store/hooks';
import type { MailState } from '../../../store/store';

/**
 * Says where the results currently on screen came from. Content search hands a query to the server
 * whenever its index can't answer it - while the startup import runs, after one failed, or with
 * encrypted search off - and the results look no different from a local search, which makes search alpha
 * feedback hard to read. Only shown when the feature flag is on!
 */
export const LastSearchSource = () => {
    const isContentSearchEnabled = useFlag('ContentSearch');
    const isSearching = isSearch(useMailSelector(selectSearch));
    // The raw tri-state, unlike the `usedEncryptedSearch` selector: `undefined` means no search has
    // been answered yet, and there is nothing to report until one has.
    const usedEncryptedSearch = useMailSelector((state: MailState) => state.elements.usedEncryptedSearch);

    if (!isContentSearchEnabled || !isSearching || usedEncryptedSearch === undefined) {
        return null;
    }

    return (
        <span className="block color-weak text-sm mb-2">
            {usedEncryptedSearch
                ? c('Info').t`Results came from the local search.`
                : c('Info').t`Results came from the server.`}
        </span>
    );
};
