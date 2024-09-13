import { type FC, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Checkbox } from '@proton/components';
import { ButtonBar } from '@proton/pass/components/Layout/Button/ButtonBar';
import { ShareMemberAvatar } from '@proton/pass/components/Share/ShareMemberAvatar';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import { useInviteRecommendations } from '@proton/pass/hooks/useInviteRecommendations';
import { selectDefaultVault } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { VirtualList } from '../Layout/List/VirtualList';

type Props = {
    autocomplete: string;
    excluded: Set<string>;
    selected: Set<string>;
    shareId?: string;
    onToggle: (email: string, selected: boolean) => void;
};

const pageSize = 50;

export const InviteRecommendations: FC<Props> = (props) => {
    const { autocomplete, excluded, selected, onToggle } = props;
    const [view, setView] = useState<MaybeNull<string>>(null);
    const listRef = useRef<List>(null);

    const startsWith = useDebouncedValue(autocomplete, 250);
    const defaultShareId = useSelector(selectDefaultVault)?.shareId;
    const shareId = props.shareId ?? defaultShareId;

    const { loadMore, state } = useInviteRecommendations(startsWith, { pageSize, shareId });
    const { organization, emails, loading } = state;

    const displayedEmails = useMemo(() => {
        const startsWith = autocomplete.toLowerCase();
        const displayed = organization !== null && view === organization.name ? organization.emails : emails;

        return isEmptyString(startsWith)
            ? displayed
            : displayed.filter((email) => email.toLowerCase().startsWith(startsWith));
    }, [emails, organization, view, autocomplete]);

    /** Used to compute the virtual list min-height as this component
     * may be wrapped in a scrollable element */
    const maxVisibleItems = Math.min(displayedEmails.length, pageSize - 1);

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
                className="flex-1 min-h-custom overflow-hidden"
                style={{ '--min-h-custom': `${40 * maxVisibleItems + 15}px` }}
            >
                {displayedEmails.length === 0 && !loading ? (
                    <em className="color-weak anime-fade-in"> {c('Warning').t`No results`}</em>
                ) : (
                    <VirtualList
                        ref={listRef}
                        onScrollEnd={() => {
                            /** recent emails are not paginated - only trigger a new paginated
                             * request if we have more organization suggestions to load */
                            if (view === organization?.name) loadMore();
                        }}
                        rowHeight={() => 40}
                        rowRenderer={({ style, index, key }) => {
                            const email = displayedEmails[index];
                            const disabled = excluded.has(email);
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
                                            <ShareMemberAvatar value={email.toUpperCase().slice(0, 2) ?? ''} />
                                            <div className="flex-1 text-ellipsis color-white mr-2">{email}</div>
                                        </div>
                                    </Checkbox>
                                </div>
                            );
                        }}
                        rowCount={displayedEmails.length}
                    />
                )}
            </div>
        </>
    );
};
