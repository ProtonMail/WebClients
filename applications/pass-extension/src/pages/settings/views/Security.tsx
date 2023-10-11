import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { sessionLockDisableIntent } from '@proton/pass/store/actions';
import { settingsEdit } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight, selectSessionLockSettings } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useSessionLockConfirmContext } from '../../../shared/components/session-lock/SessionLockConfirmContextProvider';
import { SessionLockCreate } from '../../../shared/components/session-lock/SessionLockCreate';
import { SessionLockTTLUpdate } from '../../../shared/components/session-lock/SessionLockTTLUpdate';
import { SettingsPanel } from '../component/SettingsPanel';

export const Security: VFC = () => {
    const dispatch = useDispatch();

    const [lockCreationModalOpened, setLockCreationModalOpened] = useState(false);
    const { confirmPin } = useSessionLockConfirmContext();

    const { sessionLockRegistered, sessionLockTTL } = useSelector(selectSessionLockSettings);
    const sessionLockLoading = useSelector(selectRequestInFlight(settingsEdit('session-lock')));

    const handleSessionLockToggle = async () =>
        sessionLockRegistered
            ? confirmPin({
                  onSubmit: (pin) => dispatch(sessionLockDisableIntent({ pin })),
                  assistiveText: c('Info').t`Please confirm your PIN code in order to unregister your current lock.
                        ${PASS_APP_NAME} will then never lock.`,
              })
            : setLockCreationModalOpened(true);

    return (
        <SettingsPanel title={c('Label').t`Session locking`}>
            <Checkbox
                className="mb-4"
                checked={sessionLockRegistered}
                onChange={handleSessionLockToggle}
                loading={sessionLockLoading}
            >
                <span>
                    {c('Label').t`Auto-lock ${PASS_APP_NAME}`}
                    <span className="block color-weak text-sm">{c('Info')
                        .t`Access to ${PASS_APP_NAME} will require a pin code to unlock your session`}</span>
                </span>
            </Checkbox>

            <SessionLockCreate opened={lockCreationModalOpened} onClose={() => setLockCreationModalOpened(false)} />
            <SessionLockTTLUpdate ttl={sessionLockTTL} disabled={!sessionLockRegistered || sessionLockLoading} />
        </SettingsPanel>
    );
};
