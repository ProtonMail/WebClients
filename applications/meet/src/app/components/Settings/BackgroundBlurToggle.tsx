import { c } from 'ttag';

import { SettingsToggle } from './shared/SettingsToggle';

export const BackgroundBlurToggle = ({
    backgroundBlur,
    loadingBackgroundBlur,
    isBackgroundBlurSupported,
    onChange,
    withTooltip = false,
}: {
    backgroundBlur: boolean;
    loadingBackgroundBlur: boolean;
    isBackgroundBlurSupported: boolean;
    onChange: () => void;
    withTooltip?: boolean;
}) => {
    return (
        <SettingsToggle
            id="blur-background"
            label={c('Action').t`Background blur`}
            ariaLabel={c('Alt').t`Blur background`}
            onChange={onChange}
            checked={backgroundBlur}
            loading={loadingBackgroundBlur}
            disabled={!isBackgroundBlurSupported || loadingBackgroundBlur}
            tooltip={
                withTooltip && !isBackgroundBlurSupported
                    ? c('Tooltip').t`Background blur is not supported on your browser`
                    : undefined
            }
        />
    );
};
