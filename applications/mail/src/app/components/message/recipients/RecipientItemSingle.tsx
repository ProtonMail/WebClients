import { ReactNode, RefObject, useState } from 'react';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';
import { Dropdown, DropdownMenu, generateUID, Icon } from '@proton/components';
import { getInitials } from '@proton/shared/lib/helpers/string';
import MailRecipientItem from './MailRecipientItem';
import RecipientItemLayout from './RecipientItemLayout';

interface Props {
    recipient: Recipient;
    dropdownActions: ReactNode;
    showAddress?: boolean;
    icon?: ReactNode;
    highlightKeywords?: boolean;
    anchorRef: RefObject<HTMLButtonElement>;
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
    actualLabel?: string;
    isOutside?: boolean;
}

const RecipientItemSingle = ({
    recipient,
    dropdownActions,
    showAddress,
    icon,
    highlightKeywords,
    anchorRef,
    isOpen,
    toggle,
    close,
    actualLabel,
    isOutside,
}: Props) => {
    const [uid] = useState(generateUID('dropdown-recipient'));

    const label = actualLabel || recipient.Name || recipient.Address;
    const initial = getInitials(label);

    const address = <>&lt;{recipient.Address}&gt;</>;
    const title = `${label} <${recipient.Address}>`;

    const button = (
        <>
            <button
                ref={anchorRef}
                type="button"
                onClick={toggle}
                aria-expanded={isOpen}
                className="item-icon flex-item-noshrink rounded inline-flex stop-propagation mr0-5"
                data-testid="message:recipient-button"
            >
                <span className="mauto item-abbr" aria-hidden="true">
                    {initial}
                </span>
                <span className="mauto item-caret hidden" aria-hidden="true">
                    <Icon name="angle-down" />
                </span>
                <span className="sr-only">{c('Action').t`Address options`}</span>
            </button>
            <Dropdown id={uid} originalPlacement="bottom" isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>{dropdownActions}</DropdownMenu>
            </Dropdown>
        </>
    );

    if (!isOutside) {
        return (
            <MailRecipientItem
                button={button}
                label={label}
                showAddress={showAddress}
                address={address}
                title={title}
                icon={icon}
                highlightKeywords={highlightKeywords}
            />
        );
    }

    return (
        <RecipientItemLayout
            button={button}
            label={label}
            showAddress={showAddress}
            address={address}
            title={title}
            icon={icon}
        />
    );
};

export default RecipientItemSingle;
