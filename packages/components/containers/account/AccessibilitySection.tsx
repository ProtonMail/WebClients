import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import {
    MotionModeSetting,
    ThemeFeatureSetting,
    ThemeFontFaceSetting,
    ThemeFontSizeSettingMap,
    getThemeFontFaceEntries,
    getThemeFontSizeEntries,
} from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import { Tooltip, useNotifications } from '../..';
import { useTheme } from '../themes/ThemeProvider';

const themeFontFaceEntries = getThemeFontFaceEntries();
const themeFontSizeEntries = getThemeFontSizeEntries();

const AccessibilitySection = () => {
    const { information, settings, setFeature, setFontSize, setFontFace } = useTheme();

    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const reduceMotion = information.motionMode === MotionModeSetting.Reduce;

    return (
        <SettingsSection>
            <SettingsParagraph>{c('Info')
                .t`Improve your ${BRAND_NAME} experience by adapting the application to your needs.`}</SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="fontFaceSelect" className="text-semibold">
                        {c('Label').t`Font family`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <SelectTwo
                        id="fontFaceSelect"
                        value={settings.FontFace}
                        onValue={(value) => {
                            setFontFace(value);
                            notifyPreferenceSaved();
                        }}
                    >
                        {themeFontFaceEntries.map(([id, { label: getLabel, value }]) => {
                            const label = getLabel();
                            if (id === ThemeFontFaceSetting.DYSLEXIC) {
                                return (
                                    <Option key={id} title={label} value={id}>
                                        <svg
                                            className="inline-block h-custom fill-currentcolor align-middle"
                                            style={{ '--h-custom': '1em' }}
                                            viewBox="0 0 122.33 15.55"
                                        >
                                            <path d="M0 6c0-4.12 2.1-6 5.35-6s5.44 1.71 5.34 6c-.1 4.1-1.32 6.16-5.34 6.14C1.67 12.11 0 10.11 0 6Zm9.03.15c0-2.41-1.41-4.87-3.68-4.87s-3.7 2.46-3.7 4.87 1.43 3.03 3.7 3.03 3.68-.64 3.68-3.03Zm7.84 8.64-1.81.11 1.12-6.29-.22-4.13h1.26l.25 1.05a2.54 2.54 0 0 1 2.45-1.34c1.86.06 3.14 1.47 3.14 3.78s-.92 4.17-3.14 4.17c-1.12 0-2.07-.45-2.45-1.36l-.6 4.01Zm3.24-9.48c-1.16 0-2.27.91-2.27 2.4s1.01 2.35 2.34 2.35 1.71-.87 1.65-2.35c-.06-1.48-.56-2.4-1.72-2.4Zm7.67 2.6c0 1.33.91 2.14 2.89 2.35 1.04.11 1.7 0 2.77-.46v1.74c-.91.39-1.82.59-2.82.59-2.44 0-4.12-1.53-4.12-3.95.1-2.51 1.6-4.37 3.91-4.37 1.57.13 2.98 1.18 3.43 3.71l-6.06.39Zm4.66-1.51c-.14-.85-.57-1.75-2.03-1.65-1.43.1-2.45 1.16-2.45 2.09l4.48-.43Zm11.69 5.53h-1.95l.15-4.61c.04-1.36-.38-2-1.5-2-1.54 0-2.02 1.09-1.96 2.35l.2 4.26H37l.56-7.65h.92l.24.62c.66-.31 1.19-.77 2.25-.77 1.75 0 2.7 1.26 2.84 3.28l.31 4.52ZM49.07.04h3.22c4.47 0 6.23 3.08 6.63 6.01.69 4.96-3.28 5.88-6.63 5.88h-3.22V.04Zm3.53 8.88c3.99 0 4.58-1.12 4.27-3.21-.25-1.78-1.09-3.78-4.27-3.78h-1.88v6.99h1.88Zm11.48 4.82h.88c1.08 0 2.87-1.11 2.17-2.55l-3.47-7.1h1.33l3.14 5.34 1.64-5.34h1.34l-1.95 8.32c-.52 2.23-2.82 3.14-3.94 3.14h-1.15v-1.81Zm14.85-8.66c-.87-.11-1.19-.08-1.68-.11-1.81 0-2.03.52-2.02 1.15.01.45.94.87 2.16 1.25 2.31.71 2.72 1.3 2.72 2.4 0 1.93-1.08 2.37-3.19 2.37-2.56 0-2.73-.42-3.35-.88l1.37-1.55c.81.31 1.15.39 2 .46.49.04 1.41.1 1.41-.7 0-.45-.85-.73-1.83-.92-.63-.1-2.34-.52-2.34-2.35 0-1.02.49-2.27 2.91-2.27.94 0 1.78.18 2.48.34l-.64.84ZM84.2.95h1.19a57.03 57.03 0 0 0-.45 9.43h1.67l.22 1.55h-3.22c-.17-1.55.01-7.09.59-10.98Zm6.65 6.96c0 1.33.91 2.14 2.89 2.35 1.04.11 1.7 0 2.77-.46v1.74c-.91.39-1.82.59-2.82.59-2.44 0-4.12-1.53-4.12-3.95.1-2.51 1.6-4.37 3.91-4.37 1.57.13 2.98 1.18 3.43 3.71l-6.06.39Zm4.66-1.51c-.14-.85-.57-1.75-2.03-1.65-1.43.1-2.45 1.16-2.45 2.09l4.48-.43Zm10.23 5.53-1.86-2.89-2.14 2.89h-2.09l3.38-4.19-2.37-3.66h1.62l1.74 2.45 1.97-2.45h1.55l-2.69 3.63 2.98 4.22h-2.1Zm5.8-7.71h1.12c-.1 2.31-.1 5.03.32 7.72h-1.85c.18-2.69.41-4.61.41-7.72Zm.15-2.93h.84l.21 1.6h-1.26l.21-1.6Zm9.58 4.1a5.66 5.66 0 0 0-1.47-.21c-1.36.01-2.23.84-2.23 2.93a2.41 2.41 0 0 0 3.45 2.06l1.32 1.43c-.66.39-1.54.49-2.4.43-2.9-.2-3.78-1.46-3.78-3.92 0-2.77.99-4.03 3.36-4.09a6.9 6.9 0 0 1 1.75.17v1.2Z" />
                                        </svg>
                                        <span className="sr-only">{label}</span>
                                    </Option>
                                );
                            }
                            return (
                                <Option
                                    key={id}
                                    title={label}
                                    value={id}
                                    className={clsx(!value && 'apply-font')}
                                    style={value ? { fontFamily: value } : { '--setting-font-family': 'initial' }}
                                />
                            );
                        })}
                    </SelectTwo>
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="fontSizeSelect" className="text-semibold">
                        {c('Label').t`Font size`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <SelectTwo
                        id="fontSizeSelect"
                        value={settings.FontSize}
                        onValue={(value) => {
                            setFontSize(value);
                            notifyPreferenceSaved();
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
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout className="py-1">
                <SettingsLayoutLeft>
                    <label htmlFor="scrollbarsToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Default scrollbars`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Use your browser’s default scrollbars. These are typically larger and easier to use`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="scrollbarsToggle"
                        checked={information.features.scrollbars}
                        onChange={(e) => {
                            setFeature(ThemeFeatureSetting.SCROLLBARS_OFF, e.target.checked);
                            notifyPreferenceSaved();
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout className="py-1">
                <SettingsLayoutLeft>
                    <label htmlFor="animationsToggle" className={clsx('text-semibold', reduceMotion && 'color-weak')}>
                        <span className="mr-2">{c('Label').t`Disable animations`}</span>
                        <Info title={c('Tooltip').t`When enabled, animations and transitions will not show`} />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Tooltip
                        title={
                            reduceMotion
                                ? c('Tooltip').t`The reduce motion setting is already enabled on this device`
                                : undefined
                        }
                        closeDelay={0}
                        openDelay={0}
                    >
                        <Toggle
                            id="animationsToggle"
                            checked={reduceMotion ? true : information.features.animations}
                            disabled={reduceMotion}
                            onChange={(e) => {
                                setFeature(ThemeFeatureSetting.ANIMATIONS_OFF, e.target.checked);
                                notifyPreferenceSaved();
                            }}
                        />
                    </Tooltip>
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default AccessibilitySection;
