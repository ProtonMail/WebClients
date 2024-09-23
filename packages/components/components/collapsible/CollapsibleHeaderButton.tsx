import { useContext } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

import CollapsibleContext from './CollapsibleContext';

export interface CollapsibleHeaderButtonProps extends ButtonProps {
    /**
     * Icon tooltip text used when content is collapsed and can be expanded.
     */
    expandText?: string;
    /**
     * Icon tooltip text used when content is expanded and can be collapsed.
     */
    collapseText?: string;
}

const CollapsibleHeaderButton = ({
    expandText = c('Collapsible tooltip').t`Expand`,
    collapseText = c('Collapsible tooltip').t`Collapse`,
    children,
    disabled,
    onClick,
    ...rest
}: CollapsibleHeaderButtonProps) => {
    const { isExpanded, toggle, headerId, contentId, disabled: contextDisabled } = useContext(CollapsibleContext);

    const tooltipText = isExpanded ? collapseText : expandText;

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
        onClick?.(e);
    };

    return (
        <Tooltip title={tooltipText}>
            <Button
                {...rest}
                disabled={disabled || contextDisabled}
                aria-expanded={isExpanded}
                aria-describedby={headerId}
                aria-controls={contentId}
                onClick={handleButtonClick}
            >
                {children}
                <span className="sr-only">{tooltipText}</span>
            </Button>
        </Tooltip>
    );
};
export default CollapsibleHeaderButton;
