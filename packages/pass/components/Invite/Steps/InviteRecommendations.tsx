import type { FC } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useGroups } from '@proton/pass/components/Groups/GroupsProvider';
import { InviteRecommendationRow } from '@proton/pass/components/Invite/Steps/InviteRecommendationRow';
import { ButtonBar } from '@proton/pass/components/Layout/Button/ButtonBar';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useInviteRecommendations } from '@proton/pass/hooks/invite/useInviteRecommendations';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import { selectDefaultVault } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

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
                const groupSuggestions = organizationGroups.map((group) => ({ email: group.email, isGroup: true }));
                const membersSuggestions = organization.emails.map((email) => ({ email, isGroup: false }));
                return [...groupSuggestions, ...membersSuggestions];
            }
            return suggested.map(({ email, isGroup }) => ({ email, isGroup }));
        })();

        const startsWith = props.autocomplete.toLowerCase();

        return isEmptyString(startsWith)
            ? displayed
            : displayed.filter(({ email }) => email.toLowerCase().startsWith(startsWith));
    }, [suggested, organization, view, props.autocomplete]);

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
                                rowCount={rowCount}
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
