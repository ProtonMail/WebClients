import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { BaseSpotlightMessage } from '@proton/pass/components/Spotlight/SpotlightContent';
import { AliasSyncIcon } from '@proton/pass/components/Spotlight/SpotlightIcon';
import { selectUserData } from '@proton/pass/store/selectors';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const AliasSync: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const { openSettings } = usePassCore();
    const { pendingAliasToSync: aliasCount } = useSelector(selectUserData);

    return (
        <>
            <div className="flex-1">
                <strong className="block color-invert">{c('Title').t`Sync your aliases from SimpleLogin`}</strong>
                <span className="block text-sm color-invert">
                    {c('Info').ngettext(
                        msgid`You have ${aliasCount} alias that is present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to sync it?`,
                        `You have ${aliasCount} aliases that are present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to sync them?`,
                        aliasCount
                    )}
                </span>
                <div className="mt-2">
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        size="small"
                        className="text-sm px-3"
                        onClick={pipe(onClose, () => openSettings?.('aliases'))}
                        style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                    >
                        {c('Action').ngettext(msgid`Sync alias`, `Sync aliases`, aliasCount)}
                    </Button>
                </div>
            </div>

            <div className="mr-2">
                <AliasSyncIcon />
            </div>
        </>
    );
};
