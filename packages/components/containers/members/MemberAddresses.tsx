import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { PartialMemberAddress } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

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

        const listItemClassName = clsx([displayAsFade && 'color-weak', 'my-2']);

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
            let n = amountOfAddresses;
            return (
                <li className="py-2">
                    <span className="md:hidden">{n}</span>
                    <span className="hidden md:inline">
                        {
                            // translator: addresses mean "email addresses" in this context
                            c('Info').ngettext(msgid`${n} address`, `${n} addresses`, n)
                        }
                    </span>
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
                        className="flex flex-nowrap text-left items-center"
                    >
                        <span className="md:hidden">
                            {
                                // translator: we speak about email addresses in this context
                                c('Info').ngettext(
                                    msgid`${remainingAddresses.length} more`,
                                    `${remainingAddresses.length} more`,
                                    remainingAddresses.length
                                )
                            }
                        </span>
                        <span className="hidden md:inline">
                            {
                                // translator: addresses mean email addresses in this context
                                c('Info').ngettext(
                                    msgid`${remainingAddresses.length} more address`,
                                    `${remainingAddresses.length} more addresses`,
                                    remainingAddresses.length
                                )
                            }
                        </span>
                        <Icon size={3} className="ml-1" name="chevron-down" />
                    </Button>
                </li>
            );

            return [...initiallyDisplayedAddresses, expandButton];
        }

        return initiallyDisplayedAddresses;
    };

    return (
        <ul className="unstyled my-custom" style={{ '--my-custom': 'calc(var(--space-2) * -1)' }}>
            {getAddressesListItems()}
        </ul>
    );
};

export default MemberAddresses;
