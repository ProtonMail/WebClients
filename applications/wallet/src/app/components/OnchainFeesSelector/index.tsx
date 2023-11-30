import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Badge,
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components/components';

// IN sats/vb
// TODO: connect this to blockchain explorer
const DEFAULT_FEES = 4;

export const OnChainFeesSelector = () => {
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
                        <h3 className="text-rg text-semibold flex-item-fluid">{c('Wallet Send').t`Fees`}</h3>
                        <Badge type="success">{c('Wallet Send').t`Moderate`}</Badge>
                        <Badge className="mr-0" type="primary">{c('Wallet Send').t`Recommended`}</Badge>
                    </div>
                </CollapsibleHeader>
                <CollapsibleContent>
                    <div className="mt-4 flex flex-row flex-justify-space-between">
                        <div>
                            <span className="block color-hint">{c('Wallet Send').t`${DEFAULT_FEES}sats/vb`}</span>
                            <span className="block color-hint">{c('Wallet Send')
                                .t`Confirmation in ~2hours expected`}</span>
                        </div>

                        {/* TODO: connect this to Fees modal when done */}
                        <Button className="text-sm" size="small" shape="underline">{c('Wallet Send').t`Modify`}</Button>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};
