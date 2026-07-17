import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill/Pill';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

const chevron = (
    <CollapsibleHeaderIconButton className="p-0">
        <IcChevronDown />
    </CollapsibleHeaderIconButton>
);

interface DeploymentMethodHeaderProps {
    icon: ReactNode;
    title: string;
    recommended?: boolean;
}

export const DeploymentMethodHeader = ({ icon, title, recommended }: DeploymentMethodHeaderProps) => (
    <CollapsibleHeader className="p-4" prefix={icon} suffix={chevron}>
        <div className="flex flex-row items-center gap-2">
            <span className="text-semibold flex-1">{title}</span>
            {recommended && (
                <Pill rounded="rounded-sm">
                    <span className="text-sm text-semibold color-primary">{c('Info').t`RECOMMENDED`}</span>
                </Pill>
            )}
        </div>
    </CollapsibleHeader>
);

export const DeploymentMethodBody = ({ children }: { children: ReactNode }) => (
    <CollapsibleContent animated>
        <div className="flex flex-column gap-3 pl-10 pr-4 pb-4">{children}</div>
    </CollapsibleContent>
);
