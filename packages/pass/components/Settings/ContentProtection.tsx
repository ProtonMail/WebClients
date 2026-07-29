import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SettingsPanel } from './SettingsPanel';

export const ContentProtection: FC = () => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bridge = window.ctxBridge;
        let active = true;

        if (!bridge) {
            setLoading(false);
            return;
        }

        void bridge
            .getContentProtection()
            .then((value) => {
                if (active) setEnabled(value);
            })
            .catch(noop)
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const handleToggle = async () => {
        const bridge = window.ctxBridge;
        if (!bridge) return;

        const nextEnabled = !enabled;
        setEnabled(nextEnabled);
        setLoading(true);

        try {
            await bridge.setContentProtection(nextEnabled);
        } catch {
            setEnabled(enabled);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SettingsPanel title={c('Label').t`Screen privacy`}>
            <Checkbox checked={enabled} disabled={loading} onChange={handleToggle} loading={loading}>
                <span>
                    {c('Label').t`Hide ${PASS_APP_NAME} from screen captures`}
                    <span className="block color-weak text-sm">
                        {c('Info')
                            .t`When enabled, ${PASS_APP_NAME} hides its window from screenshots, screen recordings, and screen sharing when supported by your operating system.`}
                    </span>
                </span>
            </Checkbox>
        </SettingsPanel>
    );
};
