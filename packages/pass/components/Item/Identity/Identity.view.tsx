import { type FC } from 'react';

import { c } from 'ttag';

import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCard.content';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';

export const IdentityView: FC<ItemViewProps<'creditCard'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const modifiedCount = revisionNumber - 1;

    return (
        <ItemViewPanel type="creditCard" {...itemViewProps}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <CreditCardContent revision={revision} />
            <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={handleHistoryClick} />
            <MoreInfoDropdown
                info={[
                    { label: c('Label').t`Modified`, values: [getOccurrenceString(modifiedCount)] },
                    { label: c('Label').t`Item ID`, values: [itemId] },
                    { label: c('Label').t`Vault ID`, values: [shareId] },
                ]}
            />
        </ItemViewPanel>
    );
};
