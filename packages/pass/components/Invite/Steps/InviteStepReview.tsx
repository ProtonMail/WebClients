import type { ReactNode } from 'react';

import { c } from 'ttag';

import { InviteMember } from '@proton/pass/components/Invite/Steps/InviteMember';
import type { AccessTarget } from '@proton/pass/lib/access/types';
import type { InviteFormMemberItem } from '@proton/pass/types';

type Props = {
    heading?: ReactNode;
    members: InviteFormMemberItem[];
    target: AccessTarget;
    title: string;
};

export const InviteStepReview = ({ heading, members, target, title }: Props) => (
    <div className="anime-fade-in h-full flex flex-column gap-y-3">
        <h2 className="text-xl text-bold mt-2">{c('Title').t`Review and share`}</h2>
        <div>
            <div className="color-weak text-semibold">{title}</div>
            {heading}
        </div>

        <div>
            <div className="color-weak text-semibold"> {c('Label').t`Members`}</div>
            {members.map((member) => (
                <InviteMember {...member} target={target} key={`review-${member.id}`} />
            ))}
        </div>
    </div>
);
