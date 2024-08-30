import { type FC, useContext } from 'react';

import { Button, type ButtonProps } from '@proton/atoms';
import { Icon } from '@proton/components';
import CollapsibleContext from '@proton/components/components/collapsible/CollapsibleContext';

const CollapsibleHeaderToggleButton: FC<ButtonProps> = ({ children, disabled, onClick, ...rest }) => {
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
            aria-expanded={isExpanded}
            aria-describedby={headerId}
            aria-controls={contentId}
            onClick={handleButtonClick}
        >
            {isExpanded ? <Icon name="cross" /> : <Icon name="chevron-down" />}
            {children}
        </Button>
    );
};
export default CollapsibleHeaderToggleButton;
