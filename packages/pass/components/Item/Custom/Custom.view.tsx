import { type FC } from 'react';

import { c } from 'ttag';

import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';

import { CustomContent } from './Custom.content';

export const CustomView: FC<ItemViewProps<'custom'>> = (itemViewProps) => {
    const { revision } = itemViewProps;
    const { revision: revisionNumber, shareId, itemId } = revision;
    const modifiedCount = revisionNumber - 1;

    return (
        <ItemViewPanel type="identity" {...itemViewProps}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <CustomContent revision={revision} />
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
