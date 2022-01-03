import { ReactNode, RefObject, useRef } from 'react';
import { c } from 'ttag';
import { classnames, useCombinedRefs, useHotkeys } from '@proton/components';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { highlightNode } from '@proton/encrypted-search/lib/esHighlight';
import { HighlightMetadata } from '@proton/encrypted-search';

interface Props {
    label?: ReactNode;
    itemActionIcon?: ReactNode;
    labelHasIcon?: boolean;
    showAddress?: boolean;
    address?: ReactNode;
    title?: string;
    icon?: ReactNode;
    isLoading?: boolean;
    isNarrow?: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    dropdownContent?: ReactNode;
    dropdrownAnchorRef: RefObject<HTMLButtonElement>;
    dropdownToggle?: () => void;
    isDropdownOpen?: boolean;
    canDisplayName?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
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
    highlightKeywords = false,
    highlightMetadata,
    dropdownContent,
    dropdrownAnchorRef,
    dropdownToggle,
    isDropdownOpen = false,
    canDisplayName = true,
    showDropdown = true,
    isOutside = false,
}: Props) => {
    const rootRef = useRef<HTMLSpanElement>(null);
    const highlightedLabel =
        !!label && highlightKeywords && highlightMetadata ? highlightNode(label, highlightMetadata) : label;
    const highlightedAddress =
        !!address && highlightKeywords && highlightMetadata ? highlightNode(address, highlightMetadata) : address;

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

    const showName = canDisplayName || !showAddress;

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
            onClick={(e) => {
                if (showDropdown) {
                    e.stopPropagation();
                    dropdownToggle?.();
                }
            }}
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
                        !showName && 'message-recipient-item-label-address--no-name-before-lockIcon',
                    ])}
                >
                    <span className="inline-block text-ellipsis max-w100">
                        {labelHasIcon && <span className="inline-block align-sub">{itemActionIcon}</span>}
                        {showName && (
                            <span
                                className={classnames([
                                    'message-recipient-item-label',
                                    isLoading && 'inline-block',
                                    isNarrow && 'text-strong',
                                ])}
                            >
                                {highlightedLabel}
                            </span>
                        )}
                        {icon}
                        {showAddress && (
                            <span
                                className={classnames([
                                    'message-recipient-item-address',
                                    isLoading && 'inline-block',
                                    canDisplayName && 'ml0-25',
                                    showDropdown && 'color-primary',
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
