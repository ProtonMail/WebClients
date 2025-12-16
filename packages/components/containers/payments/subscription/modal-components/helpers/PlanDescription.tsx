import { useState } from 'react';

import { c } from 'ttag';

import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import type { Included } from '@proton/shared/lib/helpers/checkout';

export const PlanDescription = ({ list }: { list: Included[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mt-8">
            <hr />
            <Collapsible externallyControlled expandByDefault={isExpanded}>
                <CollapsibleHeader
                    className="text-semibold"
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <IcChevronDown />
                        </CollapsibleHeaderIconButton>
                    }
                    onClick={() => {
                        const nextState = !isExpanded;
                        setIsExpanded(nextState);
                        checkoutTelemetry.subscriptionContainer.reportPlanDescriptionInteraction({
                            action: nextState ? 'expand' : 'collapse',
                        });
                    }}
                >
                    {c('Action').t`What do I get?`}
                </CollapsibleHeader>
                <CollapsibleContent>
                    {list.map((item) => {
                        if (item.type === 'value') {
                            return (
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb-2">
                                    <div className="flex-auto text-ellipsis mr-4">{item.text}</div>
                                    <div className="flex-auto shrink-0 text-right">{item.value}</div>
                                </div>
                            );
                        }
                        if (item.type === 'text') {
                            return (
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb-2">
                                    <div className="flex-auto">{item.text}</div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};
