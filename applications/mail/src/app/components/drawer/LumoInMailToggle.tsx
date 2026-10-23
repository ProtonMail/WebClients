import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useLumoInMailPreference from '@proton/components/components/drawer/views/lumoAgent/useLumoInMailPreference';
import Toggle from '@proton/components/components/toggle/Toggle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoMailTelemetry } from '../../lumo/telemetry/useLumoMailTelemetry';

interface Props {
    id: string;
}

const LumoInMailToggle = ({ id }: Props) => {
    const [enabled, setEnabled] = useLumoInMailPreference();
    const { createNotification } = useNotifications();
    const telemetry = useLumoMailTelemetry();

    return (
        <Toggle
            id={id}
            checked={enabled}
            onChange={({ target }) => {
                const next = target.checked;
                setEnabled(next);
                createNotification({
                    text: next
                        ? c('Success').t`${LUMO_SHORT_APP_NAME} assistant enabled`
                        : c('Success').t`${LUMO_SHORT_APP_NAME} assistant disabled`,
                });

                if (!next) {
                    telemetry.assistantDisabled();
                }
            }}
            data-testid="mail-quick-settings:lumo-toggle"
        />
    );
};

export default LumoInMailToggle;
