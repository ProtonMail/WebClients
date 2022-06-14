import { useContext } from 'react';
import { c } from 'ttag';

import CollapsibleContext from './CollapsibleContext';
import { Button, ButtonProps } from '../button';
import { Tooltip } from '../tooltip';

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
    onClick,
    ...rest
}: CollapsibleHeaderButtonProps) => {
    const { isExpanded, toggle, headerId, contentId } = useContext(CollapsibleContext);

    const tooltipText = isExpanded ? collapseText : expandText;

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        toggle();
        onClick?.(e);
    };

    return (
        <Tooltip title={tooltipText}>
            <Button
                {...rest}
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
