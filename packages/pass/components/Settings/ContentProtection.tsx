import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Banner } from '@proton/atoms/Banner/Banner';
import Checkbox from '@proton/components/components/input/Checkbox';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

const ContentProtectionDesktop: FC = () => {
    const { createNotification } = useNotifications();
    const [enabled, setEnabled] = useState<boolean>();
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
            .catch(() => {
                if (active) setEnabled(undefined);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const handleToggle = async () => {
        const bridge = window.ctxBridge;
        if (!bridge || enabled === undefined || loading) return;

        const nextEnabled = !enabled;
        setLoading(true);

        try {
            await bridge.setContentProtection(nextEnabled);
            setEnabled(nextEnabled);
        } catch {
            createNotification({
                type: 'error',
                text: c('Error').t`Unable to update screen privacy. Please try again.`,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SettingsPanel title={c('Label').t`Screen privacy`}>
            {!loading && enabled === undefined && (
                <Banner variant="danger" role="alert" className="mb-3">
                    {c('Error').t`Unable to load screen privacy. Reopen Settings to try again.`}
                </Banner>
            )}
            <Checkbox
                checked={enabled === true}
                indeterminate={enabled === undefined}
                disabled={loading || enabled === undefined}
                onChange={handleToggle}
                loading={loading}
                aria-labelledby="content-protection-label"
                aria-describedby="content-protection-description"
            >
                <span>
                    <span id="content-protection-label">
                        {c('Label').t`Hide ${PASS_APP_NAME} from screen captures`}
                    </span>
                    <span id="content-protection-description" className="block color-weak text-sm">
                        {c('Info')
                            .t`Helps prevent accidental exposure of the ${PASS_APP_NAME} window in screenshots, screen recordings, and screen sharing. Some capture tools may still capture its contents.`}
                    </span>
                </span>
            </Checkbox>
            {BUILD_TARGET === 'darwin' && (
                <Banner
                    variant="warning"
                    className="mt-3"
                    noIcon
                    contentWrapperClassName="flex flex-nowrap items-center gap-2"
                >
                    <IcExclamationTriangleFilled className="shrink-0" color="var(--banner-accent-color)" />
                    <span>
                        {c('Warning')
                            .t`On macOS, apps using ScreenCaptureKit can still capture this window, even when screen privacy is enabled.`}
                    </span>
                </Banner>
            )}
        </SettingsPanel>
    );
};

export const ContentProtection: FC = () => {
    if (!DESKTOP_BUILD || (BUILD_TARGET !== 'win32' && BUILD_TARGET !== 'darwin')) return null;
    return <ContentProtectionDesktop />;
};
