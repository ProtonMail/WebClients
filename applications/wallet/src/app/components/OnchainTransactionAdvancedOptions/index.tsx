import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components/components';

export const OnchainTransactionAdvancedOptions = () => {
    return (
        <div className="flex flex-column">
            <Collapsible>
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    <div className="flex flex-row">
                        <h3 className="text-rg text-semibold flex-item-fluid">{c('Wallet Send')
                            .t`Advanced options`}</h3>
                    </div>
                </CollapsibleHeader>
                <CollapsibleContent>TODO</CollapsibleContent>
            </Collapsible>
        </div>
    );
};
