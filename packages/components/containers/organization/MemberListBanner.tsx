import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Card, InlineLinkButton } from '@proton/atoms/index';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons';
import type { Member } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

const Wrap = ({ children }: { children: ReactNode }) => {
    return (
        <Card rounded className="mb-4 p-2" padded={false}>
            {children}
        </Card>
    );
};

const AccordionButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => {
    return (
        <InlineLinkButton type="button" className="mt-2 color-weak hover:color-weak" onClick={onClick}>
            {children}
        </InlineLinkButton>
    );
};

const MembersListItem = ({ member }: { member: Member }) => {
    const name = member.Name;
    const email = getMemberEmailOrName(member);
    return (
        <div className="text-ellipsis w-full">
            <span className="text-bold" title={name}>
                {name}
            </span>{' '}
            {email !== name && <span title={email}>({email})</span>}
        </div>
    );
};

export const MembersList = ({ members }: { members: Member[] }) => {
    const [toggled, setToggled] = useState(false);

    const max = 10;
    const total = members.length;
    const canHide = total > max;

    const firstMembers = toggled ? members : members.slice(0, max);
    const lastMembers = toggled ? [] : members.slice(max);

    return (
        <div>
            <ul className="m-0 flex flex-column gap-1 pt-2 unstyled">
                {firstMembers.map((member) => {
                    return (
                        <li key={member.ID} className="block w-full">
                            <MembersListItem member={member} />
                        </li>
                    );
                })}
            </ul>
            {lastMembers.length > 0 && (
                <AccordionButton onClick={() => setToggled(true)}>{c('Action').t`Show all`}</AccordionButton>
            )}
            {toggled && canHide && (
                <AccordionButton onClick={() => setToggled(false)}>{c('Action').t`Hide`}</AccordionButton>
            )}
        </div>
    );
};

export const MemberListBanner = ({
    icon,
    members,
    action,
}: {
    icon: IconName;
    members: ReactNode;
    action: ReactNode;
}) => {
    return (
        <Wrap>
            <div className="flex flex-column md:flex-row flex-nowrap gap-4">
                <div className="md:flex-1 gap-2 flex flex-nowrap">
                    <span className="shrink-0">
                        <Icon name={icon} className="align-text-top" />
                    </span>
                    <div>{members}</div>
                </div>
                <div className="md:shrink-0">{action}</div>
            </div>
        </Wrap>
    );
};
