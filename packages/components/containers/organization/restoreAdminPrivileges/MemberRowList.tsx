import { useNotifications } from '@proton/app-context/useNotifications';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import type { Member } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';
import clsx from '@proton/utils/clsx';

import Copy from '../../../components/button/Copy';
import { getCopiedEmailNotification, getMemberInitials } from './helper';

const MemberRow = ({ member, withCopy, last }: { member: Member; withCopy?: boolean; last?: boolean }) => {
    const { createNotification } = useNotifications();
    const email = getMemberEmailOrName(member);
    const name = member.Name;

    return (
        <li className={clsx('flex flex-nowrap items-center gap-3 py-2', !last && 'border-bottom border-weak')}>
            <Avatar color="weak" className="shrink-0">
                {getMemberInitials(member)}
            </Avatar>
            <div className="flex-1 flex flex-nowrap gap-3 items-center min-w-0">
                {name && name !== email && (
                    <span className="flex-1 text-ellipsis" title={name}>
                        {name}
                    </span>
                )}
                <span className="flex-1 text-ellipsis color-weak" title={email}>
                    {email}
                </span>
            </div>
            {withCopy && (
                <Copy
                    shape="ghost"
                    size="small"
                    className="shrink-0"
                    value={email}
                    onCopy={() => createNotification({ text: getCopiedEmailNotification() })}
                />
            )}
        </li>
    );
};

const MemberRowList = ({ members, withCopy }: { members: Member[]; withCopy?: boolean }) => {
    return (
        <ul className="unstyled m-0">
            {members.map((member, index) => (
                <MemberRow key={member.ID} member={member} withCopy={withCopy} last={index === members.length - 1} />
            ))}
        </ul>
    );
};

export default MemberRowList;
