import { ReactNode, useState, HTMLProps } from 'react';
import { c } from 'ttag';

import { Tooltip, ButtonLike, Icon } from '@proton/components';

import { generateUID } from '../../helpers';

const DEFAULT_IS_EXPANDED = true;

export interface Props extends HTMLProps<HTMLDivElement> {
    defaultIsExpanded?: boolean;
    children: ReactNode;
    headerContent: ReactNode;
    openText?: string;
    closeText?: string;
    showButton?: boolean;
}

const Collapsible = ({
    defaultIsExpanded = DEFAULT_IS_EXPANDED,
    children,
    headerContent,
    openText = c('Collapsible tooltip').t`Open`,
    closeText = c('Collapsible tooltip').t`Close`,
    showButton = true,
    ...rest
}: Props) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(defaultIsExpanded);
    const tooltipText = isExpanded ? closeText : openText;
    const contentId = generateUID('collapsible');
    const headerId = generateUID('collapsible');

    return (
        <div {...rest}>
            <header className="flex flex-nowrap flex-align-items-center">
                <div id={headerId} className="flex-item-fluid">
                    {headerContent}
                </div>
                {showButton && (
                    <Tooltip title={tooltipText}>
                        <ButtonLike
                            className="flex flex-item-noshrink ml0-5"
                            onClick={() => setIsExpanded((prevState) => !prevState)}
                            icon
                            aria-expanded={isExpanded}
                            aria-controls={contentId}
                            type="button"
                            shape="ghost"
                            color="weak"
                        >
                            <Icon name="angle-down" className="caret-like" />
                            <span className="sr-only">{tooltipText}</span>
                        </ButtonLike>
                    </Tooltip>
                )}
            </header>
            <div id={contentId} role="region" aria-labelledby={headerId} hidden={!isExpanded} aria-hidden={!isExpanded}>
                {children}
            </div>
        </div>
    );
};

export default Collapsible;
