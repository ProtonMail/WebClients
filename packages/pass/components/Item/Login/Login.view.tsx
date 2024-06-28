import { type FC } from 'react';

import { c } from 'ttag';

import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { ItemReport } from '@proton/pass/components/Monitor/Item/ItemReport';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';
import { PassFeature } from '@proton/pass/types/api/features';

export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const modifiedCount = revisionNumber - 1;
    const monitorEnabled = useFeatureFlag(PassFeature.PassMonitor);

    return (
        <ItemViewPanel type="login" {...itemViewProps}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            {monitorEnabled && isMonitored(revision) && <ItemReport shareId={shareId} itemId={itemId} />}

            <LoginContent revision={revision} />

            <ItemHistoryStats
                lastUseTime={lastUseTime}
                createTime={createTime}
                modifyTime={modifyTime}
                handleHistoryClick={handleHistoryClick}
            />

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
