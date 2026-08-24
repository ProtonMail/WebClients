import type { FC } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { useInviteRecommendations } from '../../../hooks/invite/useInviteRecommendations';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import type { AccessKeys } from '../../../lib/access/types';
import { selectDefaultVault } from '../../../store/selectors';
import type { MaybeNull } from '../../../types';
import { isEmptyString } from '../../../utils/string/is-empty-string';
import { useGroups } from '../../Groups/GroupsProvider';
import { ButtonBar } from '../../Layout/Button/ButtonBar';
import { VirtualList } from '../../Layout/List/VirtualList';
import { InviteRecommendationRow } from './InviteRecommendationRow';

export type InviteSuggestionItem = { email: string; isGroup: boolean; groupName: string | undefined };

export const filterInviteSuggestions = (query: string, items: InviteSuggestionItem[]): InviteSuggestionItem[] => {
    const contains = query.toLowerCase();
    return isEmptyString(contains)
        ? items
        : items.filter(
              ({ email, groupName }) =>
                  email.toLowerCase().includes(contains) || groupName?.toLowerCase().includes(contains)
          );
};

export type InviteRecommendationsProps = {
    autocomplete: string;
    excluded: Set<string>;
    selected: Set<string>;
    access?: AccessKeys;
    onToggle: (email: string, isGroup: boolean, selected: boolean) => void;
};

const pageSize = 50;
const rowHeight = 40;

export const InviteRecommendations: FC<InviteRecommendationsProps> = (props) => {
    const [view, setView] = useState<MaybeNull<string>>(null);
    const listRef = useRef<List>(null);

    const startsWith = useDebouncedValue(props.autocomplete, 250);
    const defaultVault = useSelector(selectDefaultVault);
    const { organizationGroups } = useGroups();

    const access = useMemo(
        /** If not `access` prop is passed consider
         * we're dealing with a vault invite */
        () => props.access ?? { shareId: defaultVault?.shareId ?? '' },
        [props.access, defaultVault]
    );

    const { loadMore, state } = useInviteRecommendations(access, startsWith, pageSize);
    const {
        suggestions: { loading: loadingSuggestions, suggested },
        organization: { loading: loadingOrganization, data: organization },
    } = state;

    const suggestions = useMemo(() => {
        const displayed = (() => {
            if (organization !== null && view === organization.name) {
                const groupSuggestions = organizationGroups.map((group) => ({
                    email: group.email,
                    isGroup: true,
                    groupName: group.name,
                }));
                const membersSuggestions = organization.emails.map((email) => ({
                    email,
                    isGroup: false,
                    groupName: undefined,
                }));
                return [...groupSuggestions, ...membersSuggestions];
            }
            return suggested.map(({ email, isGroup }) => ({ email, isGroup, groupName: undefined }));
        })();

        return filterInviteSuggestions(props.autocomplete, displayed);
    }, [suggested, organization, organizationGroups, view, props.autocomplete]);

    const loading = loadingSuggestions || loadingOrganization;
    /** Add an extra row for the loading placeholder */
    const moreLoading = loadingOrganization && suggestions.length > 0;
    const rowCount = suggestions.length + (moreLoading ? 1 : 0);
    const noResults = suggestions.length === 0 && !loading;

    return (
        <>
            <h2 className="text-lg text-bold color-weak pb-2 shrink-0">
                {c('Title').t`Suggestions`} {loading && <CircleLoader size="small" className="ml-2" />}
            </h2>

            {organization !== null && (
                <ButtonBar className="anime-fade-in shrink-0 mb-3" size="small">
                    <Button
                        onClick={() => setView(null)}
                        selected={view === null}
                        className="flex-auto text-semibold"
                        pill
                    >
                        {
                            // translator: this is a label to show recent emails
                            c('Label').t`Recent`
                        }
                    </Button>
                    <Button
                        onClick={() => setView(organization.name)}
                        selected={view === organization.name}
                        className="flex-auto text-semibold"
                        pill
                    >
                        {organization.name}
                    </Button>
                </ButtonBar>
            )}

            <div
                className="flex-1 min-h-custom overflow-hidden rounded-lg"
                style={{ '--min-h-custom': `${rowHeight * 2}px` }}
            >
                {noResults ? (
                    <em className="color-weak anime-fade-in"> {c('Warning').t`No results`}</em>
                ) : (
                    <VirtualList
                        ref={listRef}
                        onScrollEnd={() => {
                            /** recent emails are not paginated - only trigger a new paginated
                             * request if we have more organization suggestions to load */
                            if (view === organization?.name) loadMore();
                        }}
                        rowHeight={() => rowHeight}
                        rowRenderer={({ key, ...rendererProps }) => (
                            <InviteRecommendationRow
                                key={key}
                                {...rendererProps}
                                {...props}
                                moreLoading={moreLoading}
                                view={view}
                                suggestions={suggestions}
                            />
                        )}
                        rowCount={rowCount}
                    />
                )}
            </div>
        </>
    );
};
