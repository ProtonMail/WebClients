import React, { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type {
    SharedServerGroup,
    SharedServerUser,
    VpnLocationFilterPolicy,
} from '@proton/components/containers/vpn/sharedServers/useSharedServers';
import clsx from '@proton/utils/clsx';

import type { LocalStatus } from '../constants';

interface VpnLocationFilterPolicyLocal extends VpnLocationFilterPolicy {
    localStatus?: LocalStatus;
}

const PolicyUserChip = ({ user: u, deleted }: { user: SharedServerUser; deleted: boolean }) => (
    <div
        className={clsx(
            { 'enabled-chip': !deleted, 'color-disabled disabled-chip': deleted },
            `flex items-center gap-1 px-2 rounded-lg policy-member-chip prevent-interaction`
        )}
    >
        <Icon name="user-filled" />
        <div className="text-base text-semibold">{u.Name}</div>
    </div>
);

const PolicyGroupChip = ({ group, deleted }: { group: SharedServerGroup; deleted: boolean }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className={clsx(
                    { 'enabled-chip': !deleted, 'color-disabled disabled-chip': deleted },
                    `flex items-center gap-1 px-2 rounded-lg policy-member-chip`
                )}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
                shape="ghost"
                size="small"
            >
                <Icon name="users-filled" />
                <div className="text-base text-semibold">{group.Name}</div>
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                {group.Users.map((user) => (
                    <div key={user.UserID} className="flex items-center gap-1 py-2 px-4">
                        <Icon name="user-filled" />
                        <div className="text-base">{user.Name}</div>
                    </div>
                ))}
            </Dropdown>
        </>
    );
};

const estimateChipWidth = (value: string): number => value.length * 9 + 52;

const isSharedServerGroup = (items: SharedServerUser | SharedServerGroup): items is SharedServerGroup =>
    (items as SharedServerGroup)?.GroupID !== undefined;

const PolicyUsersGroupsList = ({ policy }: { policy: VpnLocationFilterPolicyLocal }) => {
    const isDeleted = policy.localStatus === 'deleted';

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const [visibleCount, setVisibleCount] = useState(0);
    // Currently only groups OR users are set in the policy, but this logic supports both.
    const combinedItems = [...policy.Groups, ...policy.Users];
    const invisibleCount = combinedItems.length - visibleCount;

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate the number of visible items to show "+ x more"
    useEffect(() => {
        let i,
            width = 0;

        for (i = 0; i < combinedItems.length; i++) {
            width += estimateChipWidth(combinedItems[i].Name);

            if (width + 100 > containerWidth * 2) {
                break;
            }
        }

        setVisibleCount(i);
    }, [containerWidth, combinedItems]);

    return (
        <div ref={containerRef} className="w-full flex flex-wrap items-center gap-3">
            {combinedItems.slice(0, visibleCount).map((item) =>
                isSharedServerGroup(item) ? (
                    <div key={'g' + item.GroupID}>
                        <PolicyGroupChip group={item} deleted={isDeleted} />
                    </div>
                ) : (
                    <div key={'u' + item.UserID}>
                        <PolicyUserChip user={item} deleted={isDeleted} />
                    </div>
                )
            )}

            {visibleCount < combinedItems.length && (
                <span className="cursor-pointer">
                    {c('Info').ngettext(msgid`+ ${invisibleCount} More`, `+ ${invisibleCount} More`, invisibleCount)}
                </span>
            )}
        </div>
    );
};

export default PolicyUsersGroupsList;
