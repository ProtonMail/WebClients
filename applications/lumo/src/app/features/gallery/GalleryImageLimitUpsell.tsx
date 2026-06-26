import { c } from 'ttag';

import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { isLimitExhausted, useRemainingLimits } from '../../services/usageLimitsStore';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import BasicUpgradeButton from '../../upsells/primitives/BasicUpgradeButton';
import { sendUpgradeButtonClickedEvent } from '../../util/telemetry';

import './GalleryImageLimitUpsell.scss';

export const GalleryImageLimitUpsell = () => {
    const remainingLimits = useRemainingLimits();
    const { hasLumoPlus } = useLumoPlan();
    const upsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.GALLERY_IMAGE_LIMIT);

    const imageLimitExhausted = isLimitExhausted(remainingLimits?.images);
    const showUpsell = imageLimitExhausted && !hasLumoPlus && Boolean(upsellConfig?.onUpgrade || upsellConfig?.path);

    if (!showUpsell) {
        return null;
    }

    return (
        <div className="gallery-image-limit-upsell flex flex-nowrap items-center justify-space-between gap-3 w-full p-4 mb-3 rounded-lg">
            <p className="flex-1 min-w-0 m-0 text-sm color-norm">
                {c('collider_2025: Info')
                    .t`You've reached your image limit for this period. Upgrade to keep creating images.`}
            </p>
            <BasicUpgradeButton
                className="shrink-0"
                path={upsellConfig?.path}
                onClick={
                    upsellConfig?.onUpgrade
                        ? () => {
                              sendUpgradeButtonClickedEvent({
                                  feature: LUMO_UPSELL_PATHS.GALLERY_IMAGE_LIMIT,
                                  to: 'modal',
                              });
                              upsellConfig.onUpgrade?.();
                          }
                        : upsellConfig?.path
                          ? () => {
                                sendUpgradeButtonClickedEvent({
                                    feature: LUMO_UPSELL_PATHS.GALLERY_IMAGE_LIMIT,
                                    to: 'path',
                                });
                            }
                          : undefined
                }
            />
        </div>
    );
};
