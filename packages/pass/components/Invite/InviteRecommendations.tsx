import { type FC, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { ButtonGroup, Checkbox } from '@proton/components/components';
import { ShareMemberAvatar } from '@proton/pass/components/Share/ShareMemberAvatar';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import { useInviteRecommendations } from '@proton/pass/hooks/useInviteRecommendations';
import { selectDefaultVault } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { VirtualList } from '../Layout/List/VirtualList';

import './InviteRecommendation.scss';

type Props = {
    autocomplete: string;
    excluded: Set<string>;
    selected: Set<string>;
    shareId?: string;
    onToggle: (email: string, selected: boolean) => void;
};

export const InviteRecommendations: FC<Props> = (props) => {
    const { autocomplete, excluded, selected, onToggle } = props;
    const [view, setView] = useState<MaybeNull<string>>(null);
    const listRef = useRef<List>(null);

    const startsWith = useDebouncedValue(autocomplete, 250);
    const defaultShareId = useSelector(selectDefaultVault)?.shareId;
    const shareId = props.shareId ?? defaultShareId;

    const { loadMore, state } = useInviteRecommendations(startsWith, { pageSize: 2, shareId });
    const { organization, emails, loading } = state;

    const displayedEmails = useMemo(() => {
        const startsWith = autocomplete.toLowerCase();
        const displayed = organization !== null && view === organization.name ? organization.emails : emails;
        return displayed.filter((email) => email.toLowerCase().startsWith(startsWith));
    }, [organization, view, autocomplete]);

    return (
        <>
            <h2 className="text-lg text-bold color-weak mb-3 shrink-0">
                {c('Title').t`Suggestions`} {loading && <CircleLoader size="small" className="ml-2" />}
            </h2>

            {organization !== null && (
                <ButtonGroup
                    shape="solid"
                    size="large"
                    className="pass-button-group mb-3 w-full anime-fade-in shrink-0"
                    color="weak"
                >
                    <Button
                        onClick={() => setView(null)}
                        selected={view === null}
                        className="flex-auto text-semibold"
                        pill
                    >
                        {c('Action').t`Recent`}
                    </Button>
                    <Button
                        onClick={() => setView(organization.name)}
                        selected={view === organization.name}
                        className="flex-auto text-semibold"
                        pill
                    >
                        {organization.name}
                    </Button>
                </ButtonGroup>
            )}

            <div className="flex-1 min-h-custom overflow-hidden" style={{ '--min-h-custom': '5em' }}>
                {displayedEmails.length === 0 && !loading ? (
                    <em className="color-weak"> {c('Warning').t`No results`}</em>
                ) : (
                    <VirtualList
                        ref={listRef}
                        onScrollEnd={() => {
                            /** recent emails are not paginated - only trigger a new paginated
                             * request if we have more organization suggestions to load */
                            if (view === organization?.name) loadMore();
                        }}
                        rowRenderer={({ style, index, key }) => {
                            const email = displayedEmails[index];
                            const disabled = excluded.has(email);
                            return (
                                <div style={style} key={key} className="flex pt-2 pb-1 pl-3 anime-fade-in">
                                    <Checkbox
                                        key={`suggestion-${view}-${index}`}
                                        className={clsx('flex flex-row-reverse mb-3 flex-1', disabled && 'opacity-0')}
                                        disabled={disabled}
                                        checked={selected.has(email) || disabled}
                                        onChange={({ target }) => onToggle(email, target.checked)}
                                    >
                                        <div className="flex flex-nowrap items-center flex-1">
                                            <ShareMemberAvatar value={email.toUpperCase().slice(0, 2) ?? ''} />
                                            <div className="flex-1 text-ellipsis color-white">{email}</div>
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
