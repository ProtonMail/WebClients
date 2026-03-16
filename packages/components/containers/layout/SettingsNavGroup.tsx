import { Children, type ReactNode, isValidElement } from 'react';

import { getIsSubsectionAvailable } from './helper';
import type { SubSectionConfig } from './interface';

interface Props {
    title?: string;
    description?: string;
    subsections?: SubSectionConfig[];
    children: ReactNode;
}

/**
 * Groups a set of navigation items (links, cards, etc.) under a titled section
 * on a settings overview page. When `subsections` is provided, children are filtered
 * positionally using `getIsSubsectionAvailable`, mirroring `PrivateMainSettingsArea`.
 * Renders nothing if all children are unavailable.
 */
const SettingsNavGroup = ({ title, description, subsections, children }: Props) => {
    const visibleChildren = Children.toArray(children).map((child, i) => {
        if (!isValidElement(child)) {
            return null;
        }
        const subsectionConfig = subsections?.[i];
        if (subsectionConfig && !getIsSubsectionAvailable(subsectionConfig)) {
            return null;
        }
        return child;
    });

    if (!visibleChildren.some(Boolean)) {
        return null;
    }

    return (
        <div>
            {title && <h2 className="text-lg text-semibold m-0 mb-2">{title}</h2>}
            {description && <p className="color-weak m-0 mb-4">{description}</p>}
            <div className={'flex flex-column overflow-hidden shadow-norm rounded-lg'}>{visibleChildren}</div>
        </div>
    );
};

export default SettingsNavGroup;
