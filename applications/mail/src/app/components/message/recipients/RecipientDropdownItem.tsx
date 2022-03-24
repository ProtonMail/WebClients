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

    // Contact might not have a Name and by default we put the Address.
    // In this case we don't want to display the Address field twice
    const hasName = recipient.Name !== '' && recipient.Name !== recipient.Address;

    const handleCopyEmail = () => {
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });

        closeDropdown();
    };

    return (
        <div className="flex flex-nowrap flex-align-items-center opacity-on-hover-container p0-5">
            <span className="item-icon flex flex-item-noshrink rounded mx0-5" aria-hidden="true">
                <span className="mauto">{initial}</span>
            </span>
            <div className="flex flex-column flex-item-fluid px0-5">
                <span className="text-ellipsis" title={recipient.Name || recipient.Address}>
                    {recipient.Name || recipient.Address}
                </span>
                {hasName && <span className="color-weak text-ellipsis">{recipient.Address}</span>}
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
