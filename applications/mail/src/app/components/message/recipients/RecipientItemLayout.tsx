import { MouseEvent, ReactNode, RefObject, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { ProtonBadgeType, useHotkeys } from '@proton/components';
import { highlightNode } from '@proton/encrypted-search';
import { useCombinedRefs } from '@proton/hooks';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    label?: ReactNode;
    itemActionIcon?: ReactNode;
    labelHasIcon?: boolean;
    /**
     * Show address except if recipient list collapsed or if recipient name = recipient email
     */
    showAddress?: boolean;
    address?: ReactNode;
    title?: string;
    ariaLabelTitle?: string;
    icon?: ReactNode;
    isLoading?: boolean;
    isNarrow?: boolean;
    dropdownContent?: ReactNode;
    dropdrownAnchorRef: RefObject<HTMLButtonElement>;
    dropdownToggle?: () => void;
    isDropdownOpen?: boolean;
    /**
     * Dropdown is shown by default, but not in the print modal
     */
    showDropdown?: boolean;
    isOutside?: boolean;
    /**
     * The recipient item is not the sender
     */
    isRecipient?: boolean;
    recipientOrGroup?: RecipientOrGroup;
    customDataTestId?: string;
}

const RecipientItemLayout = ({
    label,
    itemActionIcon,
    labelHasIcon = false,
    showAddress = true,
    address,
    title,
    ariaLabelTitle,
    icon,
    isLoading = false,
    isNarrow,
    dropdownContent,
    dropdrownAnchorRef,
    dropdownToggle,
    isDropdownOpen = false,
    showDropdown = true,
    isOutside = false,
    isRecipient = false,
    recipientOrGroup,
    customDataTestId,
}: Props) => {
    // When displaying messages sent as Encrypted Outside, this component is used
    // almost in isolation, specifically without the usual mail app (and authenticated
    // routes) around it. This means that useEncryptedSearchContext will not return
    // the usual encrypted search context but its default value, where each function
    // is mocked. Since highlightMetadata and shouldHighlight are irrelevant in that
    // scenario, the mocked version is enough and prevents the component from crashing
    const { highlightMetadata, shouldHighlight } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();

    const rootRef = useRef<HTMLSpanElement>(null);
    const highlightedLabel = useMemo(
        () => (!!label && highlightData ? highlightNode(label, highlightMetadata) : label),
        [label, highlightData]
    );
    const highlightedAddress = useMemo(
        () => (!!address && highlightData ? highlightNode(address, highlightMetadata) : address),
        [address, highlightData]
    );

    const combinedRef = useCombinedRefs(dropdrownAnchorRef, rootRef);

    // To have an ellipsis, we need to display the button as a span
    // We had to add hotkeys to make it accessible with keyboard
    useHotkeys(rootRef, [
        [
            'Enter',
            (e) => {
                if (showDropdown) {
                    e.stopPropagation();
                    dropdownToggle?.();
                }
            },
        ],
        [
            KeyboardKey.Spacebar,
            (e) => {
                if (showDropdown) {
                    e.stopPropagation();
                    dropdownToggle?.();
                }
            },
        ],
    ]);

    const handleClick = (event: MouseEvent) => {
        if (document.getSelection()?.isCollapsed && showDropdown) {
            event.stopPropagation();
            dropdownToggle?.();
        }
    };

    // translator: Example: More details about "Jack <email>"
    const labelMessageRecipientButton = c('Action').t`More details about ${ariaLabelTitle}`;

    // had to use span instead of button, otherwise ellipsis can't work
    return (
        <span
            className={clsx([
                'inline-flex flex-align-items-center flex-nowrap message-recipient-item max-w-full cursor-pointer',
                isLoading && 'flex-item-fluid',
            ])}
            role="button"
            tabIndex={0}
            onClick={handleClick}
            ref={combinedRef}
            aria-label={labelMessageRecipientButton}
            aria-expanded={isDropdownOpen}
            title={title}
            data-testid={customDataTestId ? customDataTestId : `recipient:details-dropdown-${title}`}
        >
            <span
                className={clsx(['flex flex-align-items-center flex-nowrap max-w-full', isLoading && 'flex-item-fluid'])}
            >
                <span
                    className={clsx([
                        'inline-flex flex-item-fluid flex-nowrap relative',
                        !isOutside && showDropdown && 'message-recipient-item-label-address',
                    ])}
                >
                    <span className="inline-block text-ellipsis max-w-full">
                        {labelHasIcon && (
                            <span className="inline-block align-sub" data-testid="recipient:action-icon">
                                {itemActionIcon}
                            </span>
                        )}
                        {icon}
                        <span
                            className={clsx([
                                'message-recipient-item-label',
                                isLoading && 'inline-block',
                                isNarrow && 'text-strong',
                            ])}
                            data-testid="recipient-label"
                        >
                            {highlightedLabel}
                        </span>
                        {!isOutside && recipientOrGroup?.recipient && (
                            <ProtonBadgeType recipient={recipientOrGroup.recipient} />
                        )}
                        {showAddress && (
                            <span
                                className={clsx([
                                    'message-recipient-item-address ml-1',
                                    isLoading && 'inline-block',
                                    isRecipient ? 'color-weak' : 'color-primary',
                                ])}
                                data-testid="recipient-address"
                            >
                                {highlightedAddress}
                            </span>
                        )}
                    </span>
                </span>
            </span>
            {showDropdown && dropdownContent}
        </span>
    );
};

export default RecipientItemLayout;
