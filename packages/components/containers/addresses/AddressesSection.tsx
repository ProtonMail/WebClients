import React from 'react';
import { c, msgid } from 'ttag';

import { Block, Loader } from '../../components';
import { useOrganization, useUser } from '../../hooks';

import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const { UsedAddresses, MaxAddresses } = organization || {};

    if (loadingOrganization) {
        return <Loader />;
    }

    return (
        <>
            {user.isAdmin ? (
                <AddressesWithMembers isOnlySelf={isOnlySelf} user={user} organization={organization} />
            ) : (
                <AddressesWithUser user={user} />
            )}
            {MaxAddresses > 1 ? (
                <Block className="color-weak">
                    {UsedAddresses} / {MaxAddresses}{' '}
                    {c('Info').ngettext(msgid`address used`, `addresses used`, UsedAddresses)}
                </Block>
            ) : null}
        </>
    );
};

export default AddressesSection;
