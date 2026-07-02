import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import type { Member } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';
import clsx from '@proton/utils/clsx';

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

export const MembersList = ({ members, listClassName }: { members: Member[]; listClassName?: string }) => {
    const [toggled, setToggled] = useState(false);

    const max = 3;
    const total = members.length;
    const canHide = total > max;

    const firstMembers = toggled ? members : members.slice(0, max);
    const lastMembers = toggled ? [] : members.slice(max);

    return (
        <div>
            <ul className={clsx('m-0 flex flex-column gap-1 pt-2', listClassName)}>
                {firstMembers.map((member) => {
                    return (
                        <li key={member.ID} className="w-full">
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
    variant = BannerVariants.NORM,
    members,
    action,
}: {
    variant?: BannerVariants;
    members: ReactNode;
    action: ReactNode;
}) => {
    return (
        <Banner className="p-2 mb-5" contentWrapperClassName="flex-1 flex" noIcon variant={variant} largeRadius>
            <div className="flex flex-row flex-1 gap-4">
                <div className="md:flex-1 gap-2 flex flex-nowrap">
                    <div>{members}</div>
                </div>
                <div className="md:shrink-0">{action}</div>
            </div>
        </Banner>
    );
};
