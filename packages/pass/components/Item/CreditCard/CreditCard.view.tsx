import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCardContent';
import { ItemViewHistoryStats } from '@proton/pass/components/Item/History/ItemViewHistoryStats';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import type { ItemViewProps } from '@proton/pass/components/Views/types';

export const CreditCardView: FC<ItemViewProps<'creditCard'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;

    return (
        <ItemViewPanel type="creditCard" {...itemViewProps}>
            <CreditCardContent revision={revision} />
            <ItemViewHistoryStats
                createTime={createTime}
                modifyTime={modifyTime}
                handleHistoryClick={revisionNumber > 1 ? handleHistoryClick : undefined}
            />
            <MoreInfoDropdown
                info={[
                    {
                        label: c('Label').t`Modified`,
                        values: [
                            c('Info').ngettext(
                                msgid`${revisionNumber} time`,
                                `${revisionNumber} times`,
                                revisionNumber
                            ),
                        ],
                    },
                    {
                        // translator: label for item identification number
                        label: c('Label').t`Item ID`,
                        values: [itemId],
                    },
                    {
                        // translator: label for vault identification number
                        label: c('Label').t`Vault ID`,
                        values: [shareId],
                    },
                ]}
            />
        </ItemViewPanel>
    );
};
