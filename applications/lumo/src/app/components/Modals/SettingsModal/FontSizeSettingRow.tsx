import { c } from 'ttag';

import { Option, SelectTwo, useTheme } from '@proton/components';
import { ThemeFontSizeSettingMap, getThemeFontSizeEntries } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import { SettingsSectionItem } from './SettingsSectionItem';

const themeFontSizeEntries = getThemeFontSizeEntries();

export const FontSizeSettingRow = () => {
    const { settings, setFontSize } = useTheme();

    return (
        <SettingsSectionItem
            icon="Type"
            text={c('Label').t`Font size`}
            subtext={c('collider_2025: Description').t`Adjust the size of text across the app`}
            button={
                <SelectTwo
                    id="lumo-font-size-select"
                    className="min-w-custom shrink-0"
                    style={{ '--min-w-custom': '11rem' }}
                    fullWidth={false}
                    value={settings.FontSize}
                    onValue={(value) => {
                        setFontSize(value);
                    }}
                    renderSelected={(selected) => {
                        if (selected === undefined) {
                            return null;
                        }

                        const label = ThemeFontSizeSettingMap[selected]?.label() || '';

                        return <>{label}</>;
                    }}
                >
                    {themeFontSizeEntries.map(([id, { label: getLabel, value }]) => {
                        const label = getLabel();

                        return (
                            <Option
                                key={id}
                                className={clsx('flex flex-nowrap items-center gap-2 py-0 h-custom')}
                                style={{
                                    '--h-custom': '2.5rem',
                                }}
                                title={label}
                                value={id}
                            >
                                <span
                                    className="shrink-0 w-custom text-center text-nowrap text-bold"
                                    style={{
                                        fontSize: `${value / 14}em`,
                                        '--w-custom': '1.5rem',
                                    }}
                                >
                                    Aa
                                </span>
                                <span className="flex-1">{label}</span>
                            </Option>
                        );
                    })}
                </SelectTwo>
            }
        />
    );
};
