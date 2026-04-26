import type { ReactNode, Ref } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import ProtonBadgeType from '@proton/components/components/protonBadge/ProtonBadgeType';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import { highlightNode } from '@proton/encrypted-search/esHelpers';
import { useCombinedRefs } from '@proton/hooks';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import type { RecipientOrGroup } from '../../../models/address';

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
    dropdownContent?: ReactNode;
    dropdrownAnchorRef: Ref<HTMLElement>;
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
    hasHeading?: boolean;
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
    dropdownContent,
    dropdrownAnchorRef,
    dropdownToggle,
    isDropdownOpen = false,
    showDropdown = true,
    isOutside = false,
    isRecipient = false,
    recipientOrGroup,
    customDataTestId,
    hasHeading = false,
}: Props) => {
    // When displaying messages sent as Encrypted Outside, this component is used
    // almost in isolation, specifically without the usual mail app (and authenticated
    // routes) around it. This means that useEncryptedSearchContext will not return
    // the usual encrypted search context but its default value, where each function
    // is mocked. Since highlightMetadata and shouldHighlight are irrelevant in that
    // scenario, the mocked version is enough and prevents the component from crashing
    const { highlightMetadata, shouldHighlight, esStatus } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();

    const rootRef = useRef<HTMLAnchorElement>(null);

    const breakPoints = useActiveBreakpoint();
    const isSmallViewport = breakPoints.viewportWidth['<=small'];

    // We don't want to highlight the display name in normal search.
    // However, if recipient has no display name by default, we use the address as display name.
    // In that case the address (that is in the display name) should be highlighted
    const isLabelRecipientAddress = address === `<${label}>`;
    const canHighlightLabel = !!label && highlightData && (esStatus.esEnabled || isLabelRecipientAddress);
    const highlightedLabel = useMemo(
        () => (canHighlightLabel ? highlightNode(label, highlightMetadata) : label),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-8E883D
        [label, highlightData]
    );
    const highlightedAddress = useMemo(
        () => (!!address && highlightData ? highlightNode(address, highlightMetadata) : address),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-374618
        [address, highlightData]
    );

    const combinedRef = useCombinedRefs<HTMLAnchorElement>(dropdrownAnchorRef as Ref<HTMLAnchorElement>, rootRef);

    // To have an ellipsis, we need to display the button as a span
    // We had to add hotkeys to make it accessible with keyboard
    useHotkeys(rootRef, [
        [
            'Enter',
            (e) => {
                e.preventDefault();
                if (showDropdown) {
                    e.stopPropagation();
                    dropdownToggle?.();
                }
            },
        ],
        [
            KeyboardKey.Spacebar,
            (e) => {
                e.preventDefault();
                if (showDropdown) {
                    e.stopPropagation();
                    dropdownToggle?.();
                }
            },
        ],
    ]);

    // Use a native click listener directly on the element so that stopPropagation
    // prevents useLinkHandler (which listens on a parent wrapper) from intercepting the mailto: href
    useEffect(() => {
        const el = rootRef.current;
        if (!el) {
            return;
        }

        const handleClick = (event: Event) => {
            // Always prevent default to avoid opening the mailto: href
            event.preventDefault();
            if (showDropdown) {
                // Stop propagation only when the dropdown is active, so that parent click handlers
                // (e.g. expanding a collapsed message) still fire when showDropdown is false
                event.stopPropagation();
                if (document.getSelection()?.isCollapsed) {
                    dropdownToggle?.();
                }
            }
        };

        el.addEventListener('click', handleClick);
        return () => el.removeEventListener('click', handleClick);
    }, [showDropdown, dropdownToggle]);

    // translator: Example: More details about "Jack <email>"
    const labelMessageRecipientButton = c('Action').t`More details about ${ariaLabelTitle}`;

    const emailAddress = recipientOrGroup?.recipient?.Address;

    return (
        <a
            href={emailAddress ? `mailto:${emailAddress}` : undefined}
            className={clsx([
                'inline-flex items-center flex-nowrap message-recipient-item max-w-full cursor-pointer color-inherit text-no-decoration',
                isLoading && 'flex-1',
            ])}
            ref={combinedRef}
            aria-label={labelMessageRecipientButton}
            aria-expanded={isDropdownOpen}
            title={title}
            data-testid={customDataTestId ? customDataTestId : `recipient:details-dropdown-${title}`}
        >
            <span className={clsx(['flex items-center flex-nowrap max-w-full', isLoading && 'flex-1'])}>
                <span
                    className={clsx([
                        'inline-flex flex-1 flex-nowrap relative',
                        !isOutside && showDropdown && 'message-recipient-item-label-address',
                    ])}
                >
                    {labelHasIcon && (
                        <span className="inline-block align-sub shrink-0" data-testid="recipient:action-icon">
                            {itemActionIcon}
                        </span>
                    )}
                    {icon}
                    {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                    <span
                        className="inline-block text-ellipsis max-w-full"
                        role={hasHeading ? 'heading' : undefined}
                        aria-level={hasHeading ? 2 : undefined}
                    >
                        <bdi
                            className={clsx([
                                'message-recipient-item-label',
                                isLoading && 'inline-block',
                                isSmallViewport && 'text-strong',
                            ])}
                            data-testid="recipient-label"
                        >
                            {highlightedLabel}
                        </bdi>
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
        </a>
    );
};

export default RecipientItemLayout;
