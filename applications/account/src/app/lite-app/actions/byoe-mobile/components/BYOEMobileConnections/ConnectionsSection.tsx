import type { PropsWithChildren } from 'react';

import { Collapsible } from '@proton/atoms/Collapsible/Collapsible';
import { CollapsibleContent } from '@proton/atoms/Collapsible/CollapsibleContent';
import { CollapsibleHeader } from '@proton/atoms/Collapsible/CollapsibleHeader';
import { CollapsibleHeaderIconButton } from '@proton/atoms/Collapsible/CollapsibleHeaderIconButton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

interface Props extends PropsWithChildren {
    title: string;
}

export const ConnectionsSection = ({ title, children }: Props) => {
    return (
        <Collapsible expandByDefault>
            <CollapsibleHeader
                className="px-4 pt-4 mb-1 color-hint text-semibold"
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown size={5} className="color-hint" />
                    </CollapsibleHeaderIconButton>
                }
            >
                {title}
            </CollapsibleHeader>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    );
};
