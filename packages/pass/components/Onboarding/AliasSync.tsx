import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { selectUserData } from '../../store/selectors';
import { pipe } from '../../utils/fp/pipe';
import { useOnline } from '../Core/ConnectivityProvider';
import { usePassCore } from '../Core/PassCoreProvider';
import type { BaseSpotlightMessage } from '../Spotlight/SpotlightContent';
import { AliasSyncIcon } from '../Spotlight/SpotlightIcon';

export const AliasSync: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const online = useOnline();
    const { openSettings } = usePassCore();
    const { pendingAliasToSync: aliasCount } = useSelector(selectUserData);

    useEffect(() => {
        if (aliasCount === 0) onClose();
    }, [aliasCount]);

    return (
        <>
            <div className="flex-1">
                <strong className="block">{c('Title').t`Sync your aliases from SimpleLogin`}</strong>
                <span className="block text-sm">
                    {c('Info').ngettext(
                        msgid`You have ${aliasCount} alias that is present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to sync it?`,
                        `You have ${aliasCount} aliases that are present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to sync them?`,
                        aliasCount
                    )}
                    <span className="block text-sm">
                        {c('Warning')
                            .t`Once synced, deleting aliases in ${PASS_SHORT_APP_NAME} will also delete them in SimpleLogin.`}
                    </span>
                </span>
                <div className="mt-2">
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        size="small"
                        className="text-sm px-3"
                        onClick={pipe(onClose, () => openSettings('aliases'))}
                        disabled={!online}
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
