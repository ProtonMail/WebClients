import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { ItemViewHistoryStats } from '@proton/pass/components/Item/History/ItemViewHistoryStats';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import type { ItemViewProps } from '@proton/pass/components/Views/types';

export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;

    return (
        <ItemViewPanel type="login" {...itemViewProps}>
            <LoginContent revision={revision} />

            <ItemViewHistoryStats
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
                            c('Info').ngettext(
                                msgid`${revisionNumber} time`,
                                `${revisionNumber} times`,
                                revisionNumber
                            ),
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
