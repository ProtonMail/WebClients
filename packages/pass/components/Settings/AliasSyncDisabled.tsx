import { type FC, useEffect, useId, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { AliasSyncModal } from '@proton/pass/components/Settings/AliasSyncModal';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { aliasSyncStatus } from '@proton/pass/store/actions';
import { selectUserData } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const AliasSyncDisabled: FC = () => {
    const aliasSyncId = useId();
    const [confirm, setConfirm] = useState(false);
    const { pendingAliasToSync: aliasCount } = useSelector(selectUserData);
    const { dispatch, loading } = useRequest(aliasSyncStatus, {});

    useEffect(dispatch, []);

    if (!aliasCount) return null;

    return (
        <SettingsPanel
            title={c('Label').t`Sync aliases with SimpleLogin`}
            actions={loading ? [<CircleLoader key={aliasSyncId} size="small" />] : undefined}
        >
            <Card type="primary">
                <>
                    <strong className="color-norm block mb-1 flex-1 text-ellipsis">
                        {c('Info').t`Aliases out of sync (${aliasCount})`}
                    </strong>

                    <div className="text-sm mb-4">
                        {c('Info').ngettext(
                            msgid`We detected that you have ${aliasCount} alias that is present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to import it?`,
                            `We detected that you have ${aliasCount} aliases that are present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to import them?`,
                            aliasCount
                        )}
                    </div>

                    <Button fullWidth color="norm" onClick={() => setConfirm(true)}>
                        {c('Action').t`Sync aliases`}
                    </Button>

                    {confirm && <AliasSyncModal aliasCount={aliasCount} onClose={() => setConfirm(false)} />}
                </>
            </Card>
        </SettingsPanel>
    );
};
