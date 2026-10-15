import type { PropsWithChildren } from 'react';

import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

interface Props extends PropsWithChildren {
    title: string;
}

export const CollapsibleSection = ({ title, children }: Props) => {
    return (
        <Collapsible expandByDefault>
            <CollapsibleHeader
                className="px-4 pt-4 mb-1 color-hint text-semibold"
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
            >
                {title}
            </CollapsibleHeader>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    );
};
