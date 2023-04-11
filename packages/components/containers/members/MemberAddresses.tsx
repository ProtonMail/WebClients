import { useState } from 'react';



import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { PartialMemberAddress } from '@proton/shared/lib/interfaces';

import { Icon } from '../../components';
import { classnames } from '../../helpers';

const amountOfDisplayedAddresses = 3;

interface MemberAddressesProps {
    addresses: PartialMemberAddress[] | undefined;
}

const MemberAddresses = ({ addresses = [] }: MemberAddressesProps) => {
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = () => {
        setExpanded(true);
    };

    const amountOfAddresses = addresses.length;

    const addressesPluralized = `${c('Info').ngettext(msgid`address`, `addresses`, amountOfAddresses)}`;

    const renderListItem = ({ ID, Email }: PartialMemberAddress, index: number) => {
        /*
         * By default, the addresses list shows 3 addresses as well as
         * a clickable text saying "x more addresses", which, when clicked,
         * expands the addresses list and shows all addresses.
         *
         * While not expanded the last list-item is colored more lightly as
         * if to indicate a fade.
         */
        const isLastDisplayedAddress = index === amountOfDisplayedAddresses - 1;

        const displayAsFade = !expanded && isLastDisplayedAddress && amountOfAddresses > amountOfDisplayedAddresses;

        const listItemClassName = classnames([displayAsFade && 'color-weak', 'my-2']);

        return (
            <li key={ID} className={listItemClassName}>
                <span
                    className="text-ellipsis block"
                    title={Email}
                    data-testid="users-and-addresses-table:memberAddress"
                >
                    {Email}
                </span>
            </li>
        );
    };

    const initiallyDisplayedAddresses = addresses.slice(0, amountOfDisplayedAddresses).map(renderListItem);

    const remainingAddresses = addresses.slice(amountOfDisplayedAddresses).map(renderListItem);

    const getAddressesListItems = () => {
        if (amountOfAddresses === 0) {
            return (
                <li className="pt0-5 pb0-5">
                    {amountOfAddresses}
                    <span className="no-mobile"> {addressesPluralized}</span>
                </li>
            );
        }

        if (expanded) {
            return [...initiallyDisplayedAddresses, ...remainingAddresses];
        }

        if (remainingAddresses.length > 0) {
            const expandButton = (
                <li key="expand" className="mb-2">
                    <Button
                        onClick={handleExpandClick}
                        color="norm"
                        shape="ghost"
                        size="small"
                        className="flex flex-align-items-center"
                    >
                        {remainingAddresses.length} {c('Info').t`more`}
                        {' '}
                        <span className="no-mobile">{addressesPluralized}</span>
                        <Icon size={12} className="ml-1" name="chevron-down" />
                    </Button>
                </li>
            );

            return [...initiallyDisplayedAddresses, expandButton];
        }

        return initiallyDisplayedAddresses;
    };

    return <ul className="unstyled -mt-2 -mb-2">{getAddressesListItems()}</ul>;
};

export default MemberAddresses;