import { c } from 'ttag';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';

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
        <SettingToggle
            id="blur-background"
            label={c('Action').t`Blur background`}
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
