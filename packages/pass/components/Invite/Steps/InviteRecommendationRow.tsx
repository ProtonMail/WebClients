import type { CSSProperties, FC } from 'react';
import type { ListRowProps } from 'react-virtualized';

import Checkbox from '@proton/components/components/input/Checkbox';
import { useMaybeGroup } from '@proton/pass/components/Groups/GroupsProvider';
import { MaybeGroupName } from '@proton/pass/components/Groups/MaybeGroupName';
import { ShareMemberAvatar } from '@proton/pass/components/Invite/Member/ShareMemberAvatar';
import type { InviteRecommendationsProps } from '@proton/pass/components/Invite/Steps/InviteRecommendations';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

const RowLoading: FC<{ style: CSSProperties }> = ({ style }) => (
    <div style={style} className="flex items-center anime-fade-in px-2 gap-3">
        <div className="pass-skeleton pass-skeleton--avatar rounded-lg shrink-0" style={{ '--index': 0 }} />
        <div
            className="pass-skeleton pass-skeleton--value flex-1 max-w-custom"
            style={{ '--index': 1, '--max-w-custom': '20em' }}
        />
    </div>
);

type Props = ListRowProps &
    Pick<InviteRecommendationsProps, 'onToggle' | 'excluded' | 'selected'> & {
        moreLoading: boolean;
        suggestions: {
            email: string;
            isGroup: boolean;
        }[];
        view: MaybeNull<string>;
    };

export const InviteRecommendationRow: FC<Props> = ({
    style,
    index,
    key,
    moreLoading,
    suggestions,
    excluded,
    view,
    selected,
    onToggle,
}) => {
    const suggestion = suggestions.at(index);
    const { maybeGroupProps } = useMaybeGroup(suggestion?.email);
    const disabled = suggestion && excluded.has(suggestion.email);

    if (suggestion) {
        return (
            <div style={style} key={key} className="flex anime-fade-in">
                <Checkbox
                    key={`suggestion-${view}-${index}`}
                    className={clsx('flex flex-row-reverse flex-1 ml-2', disabled && 'opacity-0')}
                    disabled={disabled}
                    checked={selected.has(suggestion.email) || disabled}
                    onChange={({ target }) => onToggle(suggestion.email, suggestion.isGroup, target.checked)}
                >
                    <div className="flex flex-nowrap items-center flex-1">
                        <ShareMemberAvatar email={suggestion.email} isGroup={suggestion.isGroup} />
                        <div className="flex-1 mr-2">
                            <MaybeGroupName {...maybeGroupProps} />
                        </div>
                    </div>
                </Checkbox>
            </div>
        );
    }

    return moreLoading && <RowLoading key={key} style={style} />;
};
