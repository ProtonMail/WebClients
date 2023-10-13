import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { SettingsPanel } from 'proton-pass-extension/lib/components/Settings/SettingsPanel';
import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { useSessionLockConfirmContext } from '@proton/pass/components/Lock/LockConfirmContextProvider';
import { LockCreate } from '@proton/pass/components/Lock/LockCreate';
import { LockTTLUpdate } from '@proton/pass/components/Lock/LockTTLUpdate';
import { sessionLockDisableIntent } from '@proton/pass/store/actions';
import { settingsEdit } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight, selectSessionLockSettings } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

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

            <LockCreate opened={lockCreationModalOpened} onClose={() => setLockCreationModalOpened(false)} />
            <LockTTLUpdate ttl={sessionLockTTL} disabled={!sessionLockRegistered || sessionLockLoading} />
        </SettingsPanel>
    );
};
