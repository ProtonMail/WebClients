import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { ThemeTypes } from '@proton/shared/lib/themes/themes';
import { PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import { Icon, ThemeCard } from '../..';
import type { Theme } from './ThemeCards';

interface Props {
    mode: 'light' | 'dark';
    minSize?: string;
    className?: string;
    themeIdentifier: ThemeTypes;
    list: Theme[];
    onChange: (themeType: ThemeTypes) => void;
    active: boolean;
}

const ThemeSyncModeDropdown = ({ mode, className, themeIdentifier, list, onChange }: Props) => {
    const dropdownButtonContent = (
        <>
            <span className="w-custom" style={{ '--w-custom': '2.75rem' }}>
                <ThemeCard
                    label={PROTON_THEMES_MAP[themeIdentifier].label}
                    id={`id_${PROTON_THEMES_MAP[themeIdentifier].identifier}`}
                    size="small"
                    colors={PROTON_THEMES_MAP[themeIdentifier].thumbColors}
                    as="div"
                    className="rounded-sm"
                />
            </span>
            <span className="flex-1">{PROTON_THEMES_MAP[themeIdentifier].label}</span>
        </>
    );

    return (
        <div className={clsx('', className)}>
            <div className={clsx('flex justify-space-between flex-nowrap gap-2 mb-2')}>
                <div className="flex items-center flex-nowrap gap-2 text-sm">
                    <Icon name={mode === 'light' ? 'sun' : 'moon'} className={clsx('color-weak shrink-0')} />
                    <span className="color-weak">
                        {mode === 'light' ? c('Title').t`Day theme` : c('Title').t`Night theme`}
                    </span>
                </div>
            </div>
            <SimpleDropdown
                as={ButtonLike}
                shape="outline"
                color="weak"
                type="button"
                originalPlacement="bottom"
                dropdownClassName="quickSettingsThemeDropdown"
                content={dropdownButtonContent}
                contentProps={{
                    size: { width: DropdownSizeUnit.Anchor, height: DropdownSizeUnit.Dynamic, maxHeight: '10rem' },
                }}
                className={clsx('w-full flex flex-nowrap justify-space-between p-2 gap-3 text-left', className)}
            >
                <DropdownMenu>
                    {list.map(({ identifier, label, thumbColors }) => {
                        const id = `id_${identifier}`;
                        return (
                            <DropdownMenuButton
                                key={label}
                                isSelected={themeIdentifier === identifier}
                                className={clsx('flex flex-nowrap items-center gap-3')}
                                onClick={() => onChange(identifier)}
                            >
                                <span className="w-custom" style={{ '--w-custom': '2.75rem' }}>
                                    <ThemeCard
                                        label={label}
                                        id={id}
                                        size="small"
                                        colors={thumbColors}
                                        selected={themeIdentifier === identifier}
                                        onChange={() => {}}
                                        as="div"
                                        className={clsx(
                                            'rounded-sm border',
                                            themeIdentifier === identifier ? 'border-primary' : 'border-weak'
                                        )}
                                        data-testid={`theme-card:theme-${label}`}
                                    />
                                </span>
                                <span className="">{label}</span>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        </div>
    );
};

export default ThemeSyncModeDropdown;
