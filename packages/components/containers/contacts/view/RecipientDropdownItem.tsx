import type { MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import Copy from '@proton/components/components/button/Copy';
import ProtonBadgeType from '@proton/components/components/protonBadge/ProtonBadgeType';
import ContactImage from '@proton/components/containers/contacts/ContactImage';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Recipient } from '@proton/shared/lib/interfaces';

interface Props {
    label: string;
    recipient: Recipient;
    bimiSelector?: string;
    closeDropdown: () => void;
    displaySenderImage: boolean;
    simple?: boolean;
    additionalAction?: ReactNode;
}

const RecipientDropdownItem = ({
    displaySenderImage,
    bimiSelector,
    label,
    recipient,
    closeDropdown,
    simple = false,
    additionalAction,
}: Props) => {
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
        <div className="flex flex-nowrap items-center p-2" onClick={handleClick}>
            <span className="item-icon flex shrink-0 rounded mx-2" aria-hidden="true">
                <span className="m-auto">
                    {simple ? (
                        <>{getInitials(label)}</>
                    ) : (
                        <ContactImage
                            email={recipient.Address}
                            name={label}
                            className="rounded"
                            bimiSelector={bimiSelector}
                            displaySenderImage={displaySenderImage}
                        />
                    )}
                </span>
            </span>
            <div className="flex flex-column flex-1 px-2" data-testid="recipient:dropdown-item--contact-name">
                <span className="text-ellipsis inline-block max-w-full user-select" title={label}>
                    {label}
                    {!simple && recipient && <ProtonBadgeType recipient={recipient} />}
                </span>
                {hasName && (
                    <span className="color-weak text-ellipsis inline-block max-w-full user-select">{`<${recipient.Address}>`}</span>
                )}
            </div>
            {additionalAction}
            <Copy
                value={recipient.Address}
                className="mr-2 shrink-0"
                onCopy={handleCopyEmail}
                tooltipText={c('Action').t`Copy email to clipboard`}
                shape="ghost"
                data-testid="recipient:dropdown-item--copy-address-button"
            />
        </div>
    );
};

export default RecipientDropdownItem;
