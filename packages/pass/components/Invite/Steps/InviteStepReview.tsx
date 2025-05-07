import { type ReactNode, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { InviteMember } from '@proton/pass/components/Invite/Steps/InviteMember';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import type { AccessTarget } from '@proton/pass/lib/access/types';
import type { InviteFormMemberItem } from '@proton/pass/types';

type Props = {
    heading?: ReactNode;
    members: InviteFormMemberItem[];
    target: AccessTarget;
    title: string;
};

const ROW_HEIGHT = 64;

export const InviteStepReview = ({ heading, members, target, title }: Props) => {
    const listRef = useRef<List>(null);

    return (
        <div className="anime-fade-in h-full flex flex-column gap-y-3 flex-nowrap *:shrink-0">
            <h2 className="text-xl text-bold mt-2">{c('Title').t`Review and share`}</h2>
            <div>
                <div className="color-weak text-semibold">{title}</div>
                {heading}
            </div>

            <div className="color-weak text-semibold"> {c('Label').t`Members`}</div>

            <div
                className="flex-1 min-h-custom overflow-hidden rounded-lg"
                style={{ '--min-h-custom': `${ROW_HEIGHT * 2}px` }}
            >
                <VirtualList
                    ref={listRef}
                    rowHeight={() => ROW_HEIGHT}
                    rowRenderer={({ style, index, key }) => {
                        const member = members[index];

                        return (
                            <div style={style} key={key}>
                                <InviteMember {...member} target={target} key={`review-${member.id}`} />
                            </div>
                        );
                    }}
                    rowCount={members.length}
                />
            </div>
        </div>
    );
};
