import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { useApi } from '@proton/components/hooks';
import { deleteAllGroupMembers, deleteGroup } from '@proton/shared/lib/api/groups';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address, Group } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import GroupItemMoreOptionsDropdown from './GroupItemMoreOptionsDropdown';
import useGroupCrypto from './useGroupCrypto';

import './GroupItem.scss';

interface Props {
    active: boolean;
    groupData: Group;
    onClick?: () => void;
    isNew?: boolean;
    onDeleteGroup?: () => void;
}

const GroupItem = ({
    active,
    groupData: { ID, MemberCount, Address: address, Name },
    onClick,
    isNew,
    onDeleteGroup,
}: Props) => {
    const api = useApi();
    const { disableEncryption, enableEncryption } = useGroupCrypto();
    const [groupAddressE2EEEnabled, setGroupAddressE2EEEnabled] = useState<boolean | undefined>(undefined);

    let realAddress: Address | undefined;
    if (!isNew) {
        // according to the type definition, address could be { Email: string; ID?: string } here
        // as of writing, all the users of this component pass a real Address object, so we can safely cast it
        realAddress = address as Address;
    }

    const memberCount = Number.isInteger(MemberCount) ? MemberCount : undefined;
    const addressKeys = realAddress?.Keys ?? [];

    useEffect(() => {
        if (isNew || addressKeys.length !== 1) {
            // do nothing if we can't retrieve a single key to determine E2EE status
            return;
        }

        const [addressKey] = addressKeys;
        const groupAddressE2EEEnabled = !hasBit(addressKey.Flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
        setGroupAddressE2EEEnabled(groupAddressE2EEEnabled);
    }, [addressKeys, isNew]);

    const handleDeleteGroup = async () => {
        await api(deleteGroup(ID));
        onDeleteGroup?.();
    };

    const handleDeleteAllGroupMembers = async () => {
        await api(deleteAllGroupMembers(ID));
    };

    const handleEnableGroupAddressE2EE = async () => {
        // realAddress is guaranteed to be defined here, but check just in case
        if (!realAddress) {
            throw new Error('realAddress is not defined');
        }
        await enableEncryption(realAddress);
        setGroupAddressE2EEEnabled(true);
    };

    const handleDisableGroupAddressE2EE = async () => {
        // realAddress is guaranteed to be defined here, but check just in case
        if (!realAddress) {
            throw new Error('realAddress is not defined');
        }
        await disableEncryption(realAddress);
        setGroupAddressE2EEEnabled(false);
    };

    return (
        <div className="relative">
            <Button
                className={clsx(['interactive-pseudo w-full pr-2 py-4', active && 'is-active'])}
                color="weak"
                shape="ghost"
                onClick={onClick}
            >
                <div className="text-left flex items-start flex-nowrap">
                    <div
                        className="mr-2 mb-2 rounded flex w-custom h-custom group-item-avatar shrink-0 "
                        style={{
                            '--w-custom': '1.75rem',
                            '--h-custom': '1.75rem',
                        }}
                    >
                        <Icon className="m-auto color-primary shrink-0" size={4} name="users-filled" />
                    </div>
                    <div className="text-left flex flex-column flex-1">
                        <span className="block max-w-full text-bold text-lg text-ellipsis" title={Name}>
                            {Name}
                        </span>
                        {address.Email && (
                            <span className="block max-w-full text-ellipsis" title={address.Email}>
                                {address.Email}
                            </span>
                        )}
                        {memberCount !== undefined && (
                            <p className="m-0 text-sm color-weak">
                                {c('Group member count').ngettext(
                                    msgid`${memberCount} member`,
                                    `${memberCount} members`,
                                    memberCount
                                )}
                            </p>
                        )}
                    </div>
                    {!isNew && (
                        <div className="shrink-0">
                            <GroupItemMoreOptionsDropdown
                                handleDeleteGroup={handleDeleteGroup}
                                handleDeleteAllGroupMembers={handleDeleteAllGroupMembers}
                                handleEnableGroupAddressE2EE={handleEnableGroupAddressE2EE}
                                handleDisableGroupAddressE2EE={handleDisableGroupAddressE2EE}
                                groupAddressE2EEEnabled={groupAddressE2EEEnabled}
                            />
                        </div>
                    )}
                </div>
            </Button>
        </div>
    );
};

export default GroupItem;
