import { type FC, useContext } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { CollapsibleContext } from '@proton/atoms/Collapsible/CollapsibleContext';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcCross } from '@proton/icons/icons/IcCross';

const CollapsibleHeaderToggleButton: FC<ButtonProps> = ({
    children,
    disabled,
    onClick,
    'aria-label': ariaLabel = c('Action').t`Toggle section`,
    ...rest
}) => {
    /* Must be used inside a <Collapsible> component */
    const { isExpanded, toggle, headerId, contentId, disabled: contextDisabled } = useContext(CollapsibleContext);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
        onClick?.(e);
    };

    return (
        <Button
            {...rest}
            disabled={disabled || contextDisabled}
            aria-label={ariaLabel}
            aria-expanded={isExpanded}
            aria-describedby={headerId}
            aria-controls={contentId}
            onClick={handleButtonClick}
        >
            {isExpanded ? <IcCross /> : <IcChevronDown />}
            {children}
        </Button>
    );
};
export default CollapsibleHeaderToggleButton;
