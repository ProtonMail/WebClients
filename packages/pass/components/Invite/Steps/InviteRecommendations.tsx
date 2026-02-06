import type { CSSProperties, FC } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Checkbox from '@proton/components/components/input/Checkbox';
import { ShareMemberAvatar } from '@proton/pass/components/Invite/Member/ShareMemberAvatar';
import { ButtonBar } from '@proton/pass/components/Layout/Button/ButtonBar';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useOrganizationGroups } from '@proton/pass/components/Organization/OrganizationProvider';
import { useGetMemberOrGroupName } from '@proton/pass/hooks/groups/useMemberOrGroupName';
import { useInviteRecommendations } from '@proton/pass/hooks/invite/useInviteRecommendations';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import { selectDefaultVault } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

type Props = {
    autocomplete: string;
    excluded: Set<string>;
    selected: Set<string>;
    access?: AccessKeys;
    onToggle: (email: string, selected: boolean) => void;
};

const pageSize = 50;
const rowHeight = 40;

const RowLoading: FC<{ style: CSSProperties }> = ({ style }) => (
    <div style={style} className="flex items-center anime-fade-in px-2 gap-3">
        <div className="pass-skeleton pass-skeleton--avatar rounded-lg shrink-0" style={{ '--index': 0 }} />
        <div
            className="pass-skeleton pass-skeleton--value flex-1 max-w-custom"
            style={{ '--index': 1, '--max-w-custom': '20em' }}
        />
    </div>
);

export const InviteRecommendations: FC<Props> = (props) => {
    const { autocomplete, excluded, selected, onToggle } = props;
    const [view, setView] = useState<MaybeNull<string>>(null);
    const listRef = useRef<List>(null);

    const startsWith = useDebouncedValue(autocomplete, 250);
    const defaultVault = useSelector(selectDefaultVault);
    const groups = useOrganizationGroups();
    const getMemberOrGroupName = useGetMemberOrGroupName();
    const groupShareFeatureFlag = useFeatureFlag(PassFeature.PassGroupInvitesV1);

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

    const displayedEmails = useMemo(() => {
        const displayed = (() => {
            if (organization !== null && view === organization.name) {
                return [...(groupShareFeatureFlag ? Object.keys(groups) : []), ...organization.emails];
            }
            return suggested.map(({ email }) => email);
        })();

        const startsWith = autocomplete.toLowerCase();

        return isEmptyString(startsWith)
            ? displayed
            : displayed.filter((email) => email.toLowerCase().startsWith(startsWith));
    }, [suggested, organization, view, autocomplete]);

    const loading = loadingSuggestions || loadingOrganization;
    /** Add an extra row for the loading placeholder */
    const moreLoading = loadingOrganization && displayedEmails.length > 0;
    const rowCount = displayedEmails.length + (moreLoading ? 1 : 0);
    const noResults = displayedEmails.length === 0 && !loading;

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
                        rowRenderer={({ style, index, key }) => {
                            if (moreLoading && index === rowCount - 1) return <RowLoading key={key} style={style} />;

                            const email = displayedEmails[index];
                            const disabled = excluded.has(email);
                            const { name, avatar } = getMemberOrGroupName(email, undefined);

                            return (
                                <div style={style} key={key} className="flex anime-fade-in">
                                    <Checkbox
                                        key={`suggestion-${view}-${index}`}
                                        className={clsx('flex flex-row-reverse flex-1 ml-2', disabled && 'opacity-0')}
                                        disabled={disabled}
                                        checked={selected.has(email) || disabled}
                                        onChange={({ target }) => onToggle(email, target.checked)}
                                    >
                                        <div className="flex flex-nowrap items-center flex-1">
                                            <ShareMemberAvatar value={avatar} />
                                            <div className="flex-1 text-ellipsis mr-2">{name}</div>
                                        </div>
                                    </Checkbox>
                                </div>
                            );
                        }}
                        rowCount={rowCount}
                    />
                )}
            </div>
        </>
    );
};
