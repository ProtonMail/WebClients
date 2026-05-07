import type { FC } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';
import type { UpdateStore } from '@proton/pass/types/desktop';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

type Props = { updateStore: UpdateStore; onCheckForUpdates: () => Promise<void> };

export const Beta: FC<Props> = ({ updateStore: { beta }, onCheckForUpdates }) => {
    const featureFlagDesktopBeta = useFeatureFlag(PassFeature.PassDesktopBeta);

    if (!featureFlagDesktopBeta) return null;

    const onToggle = async () => {
        const newValue = !beta;
        await window.ctxBridge?.setUpdateStore({ beta: newValue });
        if (newValue) await onCheckForUpdates();
    };

    return (
        <div className="flex">
            <Toggle checked={beta} onChange={onToggle} className="max-h-full">
                <span className="pl-2">
                    {c('Info').t`Enable ${PASS_SHORT_APP_NAME} beta`}
                    <span className="block color-weak text-sm">
                        {c('Info')
                            .t`Try new ${BRAND_NAME} features, updates and products before they are released to the public.`}
                        {c('Info').t`This will trigger a check for new beta releases.`}
                    </span>
                </span>
            </Toggle>
        </div>
    );
};
