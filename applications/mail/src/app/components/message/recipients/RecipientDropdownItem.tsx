import { MouseEvent } from 'react';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { Copy, useNotifications } from '@proton/components';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';

interface Props {
    label: string;
    recipient: Recipient;
    closeDropdown: () => void;
}

const RecipientDropdownItem = ({ label, recipient, closeDropdown }: Props) => {
    const initial = getInitials(label);
    const { createNotification } = useNotifications();

    // Label value can contain :
    //  - Contact Name if the recipient is a contact, or Recipient Name or Recipient Address on PM
    //  - Recipient Name or Recipient Address on EO
    // Recipient might not have a Name or a Contact Name, and by default we put the Address
    // In this case, we don't want to display the Address field twice
    const hasName = label !== '' && label !== recipient.Address;

    const handleCopyEmail = () => {
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });

        closeDropdown();
    };

    // Prevent closing dropdown if click inside the recipient info
    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="flex flex-nowrap flex-align-items-center opacity-on-hover-container p0-5" onClick={handleClick}>
            <span className="item-icon flex flex-item-noshrink rounded mx0-5" aria-hidden="true">
                <span className="mauto">{initial}</span>
            </span>
            <div className="flex flex-column flex-item-fluid px0-5">
                <span className="text-ellipsis" title={label}>
                    {label}
                </span>
                {hasName && <span className="color-weak text-ellipsis">{`<${recipient.Address}>`}</span>}
            </div>
            <Copy
                value={recipient.Address}
                className="opacity-on-hover mr0-5 flex-item-noshrink"
                onCopy={handleCopyEmail}
                tooltipText={c('Action').t`Copy email to clipboard`}
                size="small"
            />
        </div>
    );
};

export default RecipientDropdownItem;
