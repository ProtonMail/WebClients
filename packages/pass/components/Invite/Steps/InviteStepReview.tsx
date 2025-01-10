import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import { InviteMember } from '@proton/pass/components/Invite/Members/InviteMember';
import type { InviteFormMemberValue } from '@proton/pass/types';

type Props = {
    heading?: ReactNode;
    members: ListFieldValue<InviteFormMemberValue>[];
    title: string;
};

export const InviteStepReview = ({ heading, members, title }: Props) => (
    <div className="anime-fade-in">
        <h2 className="text-xl text-bold my-4">{c('Title').t`Review and share`}</h2>
        <div className="color-weak text-semibold"> {title}</div>
        {heading}

        <div className="color-weak text-semibold"> {c('Label').t`Members`}</div>
        {members.map((member) => (
            <InviteMember {...member} key={`review-${member.id}`} />
        ))}
    </div>
);
