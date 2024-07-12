import type { FC, PropsWithChildren } from 'react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components/components';

type CollapsibleHeaderProps = PropsWithChildren & {
    expanded?: boolean;
    label: string;
};

export const CollapsibleItem: FC<CollapsibleHeaderProps> = ({ children, label, expanded = false }) => {
    return (
        <Collapsible expandByDefault={expanded}>
            <CollapsibleHeader className="mb-2 color-weak">
                <CollapsibleHeaderIconButton className="color-weak">
                    <Icon name="chevron-down" />
                </CollapsibleHeaderIconButton>
                {label}
            </CollapsibleHeader>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    );
};
