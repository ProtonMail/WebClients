import { ReactNode, RefObject, useRef, MouseEvent } from 'react';
import { c } from 'ttag';
import { classnames, useCombinedRefs, useHotkeys } from '@proton/components';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { highlightNode } from '@proton/encrypted-search';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';

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
}

const RecipientItemLayout = ({
    label,
    itemActionIcon,
    labelHasIcon = false,
    showAddress = true,
    address,
    title,
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
}: Props) => {
    // When displaying messages sent as Encrypted Outside, this component is used
    // almost in isolation, specifically without the usual mail app (and authenticated
    // routes) around it. This means that useEncryptedSearchContext will not return
    // the usual encrypted search context but its default value, where each function
    // is mocked. Since highlightMetadata and shouldHighlight are irrelevant in that
    // scenario, the mocked version is enough and prevents the component from crashing
    const { highlightMetadata, shouldHighlight } = useEncryptedSearchContext();

    const rootRef = useRef<HTMLSpanElement>(null);
    const highlightedLabel = !!label && shouldHighlight() ? highlightNode(label, highlightMetadata) : label;
    const highlightedAddress = !!address && shouldHighlight() ? highlightNode(address, highlightMetadata) : address;

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
    const labelMessageRecipientButton = c('Action').t`More details about ${title}`;

    // had to use span instead of button, otherwise ellipsis can't work
    return (
        <span
            className={classnames([
                'inline-flex flex-align-items-center flex-nowrap message-recipient-item max-w100 cursor-pointer',
                isLoading && 'flex-item-fluid',
            ])}
            role="button"
            tabIndex={0}
            data-testid="message-header:from"
            onClick={handleClick}
            ref={combinedRef}
            aria-label={labelMessageRecipientButton}
            aria-expanded={isDropdownOpen}
        >
            <span
                className={classnames([
                    'flex flex-align-items-center flex-nowrap max-w100',
                    isLoading && 'flex-item-fluid',
                ])}
            >
                <span
                    className={classnames([
                        'inline-flex flex-item-fluid flex-nowrap relative',
                        !isOutside && showDropdown && 'message-recipient-item-label-address',
                    ])}
                >
                    <span className="inline-block text-ellipsis max-w100">
                        {labelHasIcon && <span className="inline-block align-sub">{itemActionIcon}</span>}
                        {icon}
                        <span
                            className={classnames([
                                'message-recipient-item-label',
                                isLoading && 'inline-block',
                                isNarrow && 'text-strong',
                            ])}
                        >
                            {highlightedLabel}
                        </span>
                        {showAddress && (
                            <span
                                className={classnames([
                                    'message-recipient-item-address ml0-25',
                                    isLoading && 'inline-block',
                                    isRecipient ? 'color-weak' : 'color-primary',
                                ])}
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
