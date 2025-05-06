import { type ReactNode, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { AccessRoleToggle } from '@proton/pass/components/Invite/Access/AccessRoleToggle';
import { InviteMember } from '@proton/pass/components/Invite/Steps/InviteMember';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import type { AccessTarget } from '@proton/pass/lib/access/types';
import type { InviteFormMemberItem, InviteFormStep, ShareRole } from '@proton/pass/types';

type Props = {
    heading?: ReactNode;
    members: InviteFormMemberItem[];
    target: AccessTarget;
    onStep: (step: InviteFormStep) => Promise<void>;
    onUpdate: (members: InviteFormMemberItem[]) => Promise<void>;
};

const ROW_HEIGHT = 64;

export const InviteStepPermissions = ({ heading, members, target, onStep, onUpdate }: Props) => {
    const listRef = useRef<List>(null);

    return (
        <div className="anime-fade-in h-full flex flex-column gap-y-3 flex-nowrap *:shrink-0">
            {heading}
            <h2 className="text-xl text-bold">{c('Title').t`Set access level`}</h2>

            <div className="w-full flex flex-nowrap items-center justify-center justify-between gap-3 text-lg">
                <div className="flex-auto shrink-0">
                    <button
                        className="text-break-all text-left color-weak text-semibold"
                        onClick={() => onStep('members')}
                    >
                        {c('Title').t`Members`} ({members.length})
                    </button>
                </div>

                <AccessRoleToggle
                    onRoleChange={(role) =>
                        onUpdate(members.map(({ id, value }) => ({ id, value: { ...value, role } })))
                    }
                />
            </div>
            <div
                className="flex-1 min-h-custom overflow-hidden rounded-lg"
                style={{ '--min-h-custom': `${ROW_HEIGHT * 2}px` }}
            >
                <VirtualList
                    ref={listRef}
                    rowHeight={() => ROW_HEIGHT}
                    rowRenderer={({ style, index, key }) => {
                        const member = members[index];

                        const onRemove = async () => {
                            const update = members.filter(({ id }) => id !== member.id);
                            await onUpdate(update);
                            await onStep(update.length === 0 ? 'members' : 'permissions');
                        };

                        const onRoleChange = (role: ShareRole) =>
                            onUpdate(
                                members.map(({ id, value }) => ({
                                    id,
                                    value: { ...value, role: id === member.id ? role : value.role },
                                }))
                            );

                        return (
                            <div style={style} key={key}>
                                <InviteMember
                                    {...member}
                                    target={target}
                                    key={`member-${member.id}`}
                                    onRemove={onRemove}
                                    onRoleChange={onRoleChange}
                                />
                            </div>
                        );
                    }}
                    rowCount={members.length}
                />
            </div>
        </div>
    );
};
