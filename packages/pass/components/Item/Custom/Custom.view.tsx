import { c } from 'ttag';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';
import type { ItemCustomType, ItemType } from '@proton/pass/types';

import { CustomContent } from './Custom.content';

export const CustomView = <T extends ItemCustomType>(itemViewProps: ItemViewProps<T>) => {
    const { revision } = itemViewProps;
    const { revision: revisionNumber, shareId, itemId } = revision;
    const modifiedCount = revisionNumber - 1;

    return (
        <ItemViewPanel type={revision.data.type} {...(itemViewProps as ItemViewProps<ItemType>)}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <CustomContent revision={revision} />
            <FileAttachmentsContentView revision={revision} />
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
