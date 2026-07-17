import type { ComponentProps, ReactNode } from 'react';

import { c } from 'ttag';

import { CollapsibleGroup } from '@proton/components/components/collapsible/CollapsibleGroup';

type CollapsibleGroupChildren = ComponentProps<typeof CollapsibleGroup>['children'];

interface Props {
    intro: ReactNode;
    children: CollapsibleGroupChildren;
}

export const PlatformInstructions = ({ intro, children }: Props) => (
    <div className="flex flex-column gap-4">
        <p className="m-0">{intro}</p>
        <h3 className="text-semibold">{c('Title').t`Choose a deployment method`}</h3>
        <CollapsibleGroup defaultValue="mdm">{children}</CollapsibleGroup>
    </div>
);
