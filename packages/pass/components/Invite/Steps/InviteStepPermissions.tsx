import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import { AccessRoleToggle } from '@proton/pass/components/Invite/Access/AccessRoleToggle';
import { InviteMember } from '@proton/pass/components/Invite/Steps/InviteMember';
import type { InviteFormMemberValue, InviteFormStep } from '@proton/pass/types';

type Props = {
    heading?: ReactNode;
    members: ListFieldValue<InviteFormMemberValue>[];
    onUpdate: (members: ListFieldValue<InviteFormMemberValue>[]) => void;
    onStep: (step: InviteFormStep) => void;
};

export const InviteStepPermissions = ({ heading, members, onStep, onUpdate }: Props) => (
    <div className="anime-fade-in h-full flex flex-column gap-y-3">
        {heading}
        <h2 className="text-xl text-bold">{c('Title').t`Set access level`}</h2>

        <div className="w-full flex flex-nowrap items-center justify-center justify-between gap-3 text-lg">
            <div className="flex-auto shrink-0">
                <button className="text-break-all text-left color-weak text-semibold" onClick={() => onStep('members')}>
                    {c('Title').t`Members`} ({members.length})
                </button>
            </div>

            <AccessRoleToggle
                onRoleChange={(role) => onUpdate(members.map(({ id, value }) => ({ id, value: { ...value, role } })))}
            />
        </div>
        <div>
            {members.map((member) => (
                <InviteMember
                    {...member}
                    key={`member-${member.id}`}
                    onRemove={() => {
                        const update = members.filter(({ id }) => id !== member.id);
                        onUpdate(update);
                        onStep(update.length === 0 ? 'members' : 'permissions');
                    }}
                    onRoleChange={(role) =>
                        onUpdate(
                            members.map(({ id, value }) => ({
                                id,
                                value: {
                                    ...value,
                                    role: id === member.id ? role : value.role,
                                },
                            }))
                        )
                    }
                />
            ))}
        </div>
    </div>
);
