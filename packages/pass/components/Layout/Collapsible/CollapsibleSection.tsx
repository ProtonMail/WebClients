import type { FC, PropsWithChildren, ReactNode } from 'react';

import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Icon from '@proton/components/components/icon/Icon';

type CollapsibleSectionProps = PropsWithChildren & {
    label: ReactNode;
    expanded?: boolean;
    suffix?: ReactNode;
    className?: string;
};

export const CollapsibleSection: FC<CollapsibleSectionProps> = ({
    children,
    className,
    label,
    expanded = false,
    suffix,
}) => (
    <Collapsible expandByDefault={expanded} className={className}>
        <CollapsibleHeader className="flex flex-nowrap justify-space-between mb-2 color-weak" suffix={suffix}>
            <div className="flex flex-nowrap items-center gap-1">
                <CollapsibleHeaderIconButton className="color-weak shrink-0" pill size="small">
                    <Icon name="chevron-down" />
                </CollapsibleHeaderIconButton>
                <span className="flex-1 text-ellipsis">{label}</span>
            </div>
        </CollapsibleHeader>
        <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
);
