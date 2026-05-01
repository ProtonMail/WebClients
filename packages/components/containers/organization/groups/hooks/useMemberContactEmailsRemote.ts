import { useEffect, useState } from 'react';

import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import useApi from '@proton/components/hooks/useApi';
import { searchMembersSummary } from '@proton/shared/lib/api/members';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

/**
 * Searches org members by name or email and returns their addresses as ContactEmail objects,
 * suitable for use as autocomplete suggestions.
 *
 * Loading state is set immediately on user input; the API call is debounced by 300ms
 * to avoid excessive requests while typing. In-flight requests are aborted when the
 * query changes. Aborted requests do not reset loading state.
 *
 * Returns an empty array when the query is blank; no API call is made in that case.
 *
 * @param query - Raw input string from the autocomplete field (trimmed by the caller).
 * @returns Tuple of [contactEmails, loading].
 */
const useMemberContactEmailsRemote = (
    query: string,
    groupId: string
): [contactEmails: ContactEmail[], loading: boolean] => {
    const api = useApi();
    const [contactEmails, setContactEmails] = useState<ContactEmail[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounceInput(query, 300);

    // Respond to input instantly: show spinner on first keystroke, clear results when empty.
    // The API call is still debounced below to avoid excessive requests while typing.
    useEffect(() => {
        setLoading(query.length > 0);
        if (!query) {
            setContactEmails([]);
        }
    }, [query]);

    useEffect(() => {
        if (!debouncedQuery) {
            setContactEmails([]);
            return;
        }
        const abortController = new AbortController();
        void api<{ MemberSummaries: { Name: string; Email: string; ID: string }[] }>({
            ...searchMembersSummary({ q: debouncedQuery, limit: 20, excludeGroupId: groupId }),
            signal: abortController.signal,
        })
            .then(({ MemberSummaries }) => {
                // transform MemberSummaries to ContactEmail[]
                const contactEmailsFromSummaries: ContactEmail[] = MemberSummaries.map((member) => ({
                    ID: member.Email,
                    Email: member.Email,
                    Name: member.Name,
                    Type: [],
                    Defaults: 0,
                    Order: 0,
                    ContactID: member.Email,
                    LabelIDs: [],
                    LastUsedTime: 0,
                }));
                setContactEmails(contactEmailsFromSummaries);
                setLoading(false);
            })
            .catch((e: Error) => {
                if (e.name !== 'AbortError') {
                    setContactEmails([]);
                    setLoading(false);
                }
            });
        return () => abortController.abort();
    }, [debouncedQuery, groupId]);

    return [contactEmails, loading];
};

export default useMemberContactEmailsRemote;
