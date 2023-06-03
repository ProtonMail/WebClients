import { c } from 'ttag';

import { PROTON_THEMES_MAP, ThemeTypes } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import { Icon, Info, ThemeCards } from '../..';
import { Theme } from './ThemeCards';
import { ThemeSvgSize } from './ThemeSvg';

interface Props {
    mode: 'light' | 'dark';
    size?: ThemeSvgSize;
    minSize?: string;
    className?: string;
    listClassName?: string;
    themeIdentifier: ThemeTypes;
    list: Theme[];
    onChange: (themeType: ThemeTypes) => void;
    active: boolean;
}

const ThemeSyncModeCard = ({
    mode,
    size = 'medium',
    className,
    listClassName,
    themeIdentifier,
    list,
    onChange,
    active,
}: Props) => {
    return (
        <div className={clsx('flex-item-fluid border rounded-lg p-4', className)}>
            <div className={clsx(size !== 'small' && 'flex flex-justify-space-between flex-nowrap gap-2', 'mb-4')}>
                <div className="flex flex-align-items-center flex-nowrap gap-2">
                    <Icon name={mode === 'light' ? 'sun' : 'moon'} className="flex-item-noshrink" />
                    <span className={clsx(active && 'text-semibold')}>
                        {mode === 'light' ? c('Title').t`Day theme` : c('Title').t`Night theme`}
                        {active && ` ${c('Title').t`(active)`}`}
                    </span>
                    <Info
                        title={
                            mode === 'light'
                                ? c('Tooltip')
                                      .t`The selected theme will be active when your system is set to "light mode"`
                                : c('Tooltip')
                                      .t`The selected theme will be active when your system is set to "dark mode"`
                        }
                    />
                </div>
                <div className={clsx(active && 'text-semibold', size === 'small' && 'ml-6')}>
                    {PROTON_THEMES_MAP[themeIdentifier].label}
                </div>
            </div>
            <ThemeCards
                size={size}
                className={listClassName}
                list={list}
                themeIdentifier={themeIdentifier}
                onChange={onChange}
            />
        </div>
    );
};

export default ThemeSyncModeCard;
