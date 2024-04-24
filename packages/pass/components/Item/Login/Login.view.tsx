import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { ItemReport } from '@proton/pass/components/Monitor/Item/ItemReport';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isHealthCheckSkipped } from '@proton/pass/lib/items/item.predicates';
import { PassFeature } from '@proton/pass/types/api/features';

export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const modifiedCount = revisionNumber - 1;

    const monitorEnabled = useFeatureFlag(PassFeature.PassMonitor);
    const showReport = !isHealthCheckSkipped(revision);

    return (
        <ItemViewPanel type="login" {...itemViewProps}>
            {monitorEnabled && showReport && <ItemReport shareId={shareId} itemId={itemId} />}
            <LoginContent revision={revision} />

            <ItemHistoryStats
                lastUseTime={lastUseTime}
                createTime={createTime}
                modifyTime={modifyTime}
                handleHistoryClick={handleHistoryClick}
            />

            <MoreInfoDropdown
                info={[
                    {
                        label: c('Label').t`Modified`,
                        values: [
                            c('Info').ngettext(msgid`${modifiedCount} time`, `${modifiedCount} times`, modifiedCount),
                        ],
                    },
                    {
                        label: c('Label').t`Item ID`,
                        // translator: label for item identification number
                        values: [itemId],
                    },
                    {
                        label: c('Label').t`Vault ID`,
                        // translator: label for vault identification number
                        values: [shareId],
                    },
                ]}
            />
        </ItemViewPanel>
    );
};
