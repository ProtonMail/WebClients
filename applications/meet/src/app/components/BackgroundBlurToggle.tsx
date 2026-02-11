import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Toggle } from '@proton/components';
import clsx from '@proton/utils/clsx';

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
        <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap">
            <label
                className={clsx('setting-label text-ellipsis text-rg', backgroundBlur ? 'color-norm' : 'color-hint')}
                htmlFor={withTooltip ? 'blur-background-with-tooltip' : 'blur-background'}
            >{c('Action').t`Background blur`}</label>
            {withTooltip ? (
                <Tooltip
                    title={
                        !isBackgroundBlurSupported
                            ? c('Tooltip').t`Background blur is not supported on your browser`
                            : c('Tooltip').t`Background blur`
                    }
                >
                    <span>
                        <Toggle
                            id="blur-background-with-tooltip"
                            checked={backgroundBlur}
                            onChange={onChange}
                            className={clsx('settings-toggle', backgroundBlur ? '' : 'settings-toggle-inactive')}
                            loading={loadingBackgroundBlur}
                            disabled={!isBackgroundBlurSupported || loadingBackgroundBlur}
                        />
                    </span>
                </Tooltip>
            ) : (
                <Toggle
                    id="blur-background"
                    checked={backgroundBlur}
                    onChange={onChange}
                    className={clsx('settings-toggle', backgroundBlur ? '' : 'settings-toggle-inactive')}
                    aria-label={c('Alt').t`Blur background`}
                    loading={loadingBackgroundBlur}
                    disabled={!isBackgroundBlurSupported || loadingBackgroundBlur}
                />
            )}
        </div>
    );
};
