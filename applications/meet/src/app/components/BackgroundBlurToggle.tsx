import { c } from 'ttag';

import { Toggle } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { ConditionalTooltip } from './ConditionalTooltip/ConditionalTooltip';

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
                className={clsx('setting-label text-ellipsis', backgroundBlur ? 'color-norm' : 'color-hint')}
                htmlFor="blur-background"
            >{c('Action').t`Background blur`}</label>
            <ConditionalTooltip
                title={
                    withTooltip && !isBackgroundBlurSupported
                        ? c('Tooltip').t`Background blur is not supported on your browser`
                        : undefined
                }
            >
                <Toggle
                    id="blur-background"
                    checked={backgroundBlur}
                    onChange={onChange}
                    className={clsx('settings-toggle', backgroundBlur ? '' : 'settings-toggle-inactive')}
                    aria-label={c('Alt').t`Blur background`}
                    loading={loadingBackgroundBlur}
                    disabled={!isBackgroundBlurSupported || loadingBackgroundBlur}
                />
            </ConditionalTooltip>
        </div>
    );
};
