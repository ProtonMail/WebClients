import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useNotifications from '@proton/components/hooks/useNotifications';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MotionModeSetting, ThemeFeatureSetting, ThemeFontFaceSetting } from '@proton/shared/lib/themes/constants';
import {
    ThemeFontSizeSettingMap,
    getThemeFontFaceEntries,
    getThemeFontSizeEntries,
} from '@proton/shared/lib/themes/themes';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useTheme } from '../themes/ThemeProvider';

const themeFontFaceEntries = getThemeFontFaceEntries();
const themeFontSizeEntries = getThemeFontSizeEntries();

const AccessibilitySection = () => {
    const { information, settings, setFeature, setFontSize, setFontFace } = useTheme();

    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const isHyperLegibleFontAvailable = useFlag('AtkinsonHyperlegible');

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
                        {themeFontFaceEntries
                            .filter(([id]) => id !== ThemeFontFaceSetting.ATKINSON || isHyperLegibleFontAvailable)
                            .map(([id, { label: getLabel, value }]) => {
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
                                if (id === ThemeFontFaceSetting.ATKINSON) {
                                    return (
                                        <Option key={id} title={label} value={id}>
                                            <svg
                                                className="inline-block h-custom fill-currentcolor align-middle"
                                                style={{ '--h-custom': '0.9em' }}
                                                viewBox="0 0 176.8 17"
                                            >
                                                <path d="M0 13.072 4.841.47h1.796l5.159 12.602H9.894L8.426 9.255H3.155l-1.384 3.817zm3.637-5.173h4.271L6.595 4.406a34 34 0 0 1-.894-2.612 17 17 0 0 1-.68 2.409zm12.669 3.789.226 1.366a5.6 5.6 0 0 1-1.17.141q-.841 0-1.306-.268a1.5 1.5 0 0 1-.655-.7q-.19-.433-.19-1.828V5.146h-1.134V3.945h1.134v-2.26l1.539-.93v3.19h1.556v1.201H14.75v5.341q0 .658.084.849a.65.65 0 0 0 .264.303q.187.108.529.109.26 0 .679-.06m1.521 1.384V.47h1.549v7.186l3.662-3.711h2.003l-3.489 3.388 3.842 5.739h-1.909l-3.017-4.666-1.092 1.05v3.616zm8.802-10.82V.47h1.55v1.782zm0 10.82V3.945h1.55v9.127zm3.905 0V3.945h1.391v1.296q1.008-1.504 2.908-1.503.824 0 1.515.295.693.296 1.038.778.342.483.479 1.145.087.43.088 1.503v5.613h-1.549V7.519q0-.944-.179-1.411a1.5 1.5 0 0 0-.642-.751q-.457-.278-1.077-.278-.99 0-1.707.627-.72.626-.719 2.38v4.986zm9.172-2.726 1.529-.239q.13.918.718 1.409.591.492 1.648.493 1.066 0 1.581-.437.517-.433.517-1.018 0-.526-.457-.823-.317-.208-1.581-.525-1.7-.43-2.36-.743-.657-.318-.996-.87a2.3 2.3 0 0 1-.342-1.225q0-.61.278-1.13.283-.521.765-.863.359-.268.982-.454a4.7 4.7 0 0 1 1.338-.183q1.074 0 1.888.31.81.309 1.197.837.387.529.535 1.416l-1.514.204q-.102-.704-.599-1.099-.493-.398-1.397-.398-1.065 0-1.522.353-.454.355-.454.827 0 .3.19.543.187.246.591.412.233.084 1.367.393 1.644.44 2.292.719t1.017.813q.37.532.37 1.324 0 .771-.45 1.454-.451.687-1.303 1.06t-1.926.373q-1.778 0-2.712-.739-.932-.74-1.19-2.194m8.845-1.837q0-2.536 1.409-3.758 1.18-1.013 2.873-1.013 1.884 0 3.077 1.232 1.194 1.236 1.194 3.408 0 1.764-.528 2.775a3.7 3.7 0 0 1-1.539 1.566 4.47 4.47 0 0 1-2.204.56q-1.918 0-3.099-1.228-1.182-1.23-1.183-3.542m1.592 0q0 1.752.764 2.626t1.926.874q1.151 0 1.915-.877.768-.877.768-2.676 0-1.694-.771-2.563-.768-.874-1.912-.874a2.46 2.46 0 0 0-1.926.866q-.764.87-.764 2.624m8.775 4.563V3.945h1.393v1.296q1.008-1.504 2.905-1.503.825 0 1.518.295.694.296 1.035.778.345.483.483 1.145.084.43.084 1.503v5.613h-1.545V7.519q0-.944-.18-1.411a1.5 1.5 0 0 0-.641-.751q-.462-.278-1.081-.278-.986 0-1.704.627-.719.626-.719 2.38v4.986zm14.932 0V.47h1.669v5.176h6.549V.47h1.669v12.602h-1.669v-5.94h-6.549v5.94zm12.397 3.517-.172-1.454q.507.138.884.137.518 0 .827-.168.31-.173.507-.483.145-.233.472-1.151.042-.131.137-.381l-3.465-9.144h1.67l1.898 5.286q.37 1.006.662 2.115.267-1.066.636-2.08l1.952-5.321h1.548l-3.475 9.282q-.557 1.507-.866 2.073-.412.765-.947 1.12-.532.36-1.271.36-.448 0-.997-.191m8.87-.017V3.945h1.412v1.186q.496-.697 1.123-1.045.63-.349 1.525-.348 1.168 0 2.059.602.895.601 1.353 1.696.453 1.095.453 2.402 0 1.402-.503 2.524-.502 1.124-1.461 1.719-.958.598-2.014.598-.774 0-1.391-.327a3.2 3.2 0 0 1-1.007-.824v4.444zm1.401-8.011q0 1.76.715 2.603.711.845 1.725.845 1.032 0 1.768-.874.736-.873.736-2.704 0-1.747-.718-2.613-.72-.87-1.715-.869-.99 0-1.75.926-.76.923-.761 2.686m14.64 1.571 1.6.2q-.378 1.402-1.402 2.173-1.025.774-2.613.774-2.003 0-3.176-1.232-1.176-1.236-1.175-3.461 0-2.303 1.186-3.578 1.187-1.27 3.077-1.27 1.831 0 2.993 1.246t1.162 3.507q0 .137-.01.412h-6.807q.085 1.506.849 2.306.767.8 1.908.8.852 0 1.455-.448.602-.447.953-1.429m-5.08-2.5h5.098q-.105-1.152-.584-1.729-.739-.895-1.919-.895-1.063 0-1.793.715-.724.715-.802 1.909m8.605 5.44V3.945h1.391v1.384q.535-.972.986-1.281.45-.31.993-.31.782 0 1.588.5l-.532 1.433q-.566-.335-1.133-.335-.508 0-.912.307-.405.302-.578.845a6 6 0 0 0-.257 1.806v4.778zm5.845 0V.47h1.546v12.602zm10.193-2.94 1.603.2q-.381 1.402-1.401 2.173-1.026.774-2.617.774-2 0-3.176-1.232-1.173-1.236-1.173-3.461 0-2.303 1.187-3.578 1.187-1.27 3.077-1.27 1.832 0 2.993 1.246 1.159 1.246 1.159 3.507 0 .137-.007.412h-6.81q.088 1.506.852 2.306t1.909.8q.852 0 1.451-.448.6-.447.953-1.429m-5.077-2.5h5.095q-.102-1.152-.584-1.729-.74-.895-1.915-.895-1.068 0-1.793.715-.726.715-.803 1.909m8.338 6.197 1.504.225q.095.694.524 1.014.577.43 1.574.43 1.074 0 1.658-.43.585-.43.793-1.204.119-.473.109-1.986-1.015 1.194-2.528 1.194-1.881 0-2.912-1.356-1.032-1.36-1.032-3.26 0-1.307.472-2.408.472-1.107 1.373-1.708.899-.602 2.109-.602 1.617 0 2.666 1.306V3.945h1.426v7.891q0 2.13-.433 3.021-.436.89-1.377 1.405-.94.518-2.317.518-1.633 0-2.637-.736-1.007-.736-.972-2.215m1.282-5.483q0 1.797.711 2.62.714.828 1.789.828 1.066 0 1.788-.825.722-.82.722-2.573 0-1.676-.743-2.528-.742-.849-1.792-.849-1.032 0-1.753.839-.723.837-.722 2.488m8.802-6.094V.47h1.546v1.782zm0 10.82V3.945h1.546v9.127zm5.327 0h-1.436V.47h1.549v4.496q.98-1.228 2.5-1.228.845 0 1.595.338.754.34 1.24.954.485.616.76 1.486a6.1 6.1 0 0 1 .275 1.855q0 2.346-1.162 3.626-1.16 1.282-2.785 1.282-1.617 0-2.536-1.348zm-.017-4.634q0 1.645.447 2.373.732 1.197 1.979 1.198 1.013 0 1.754-.885.738-.879.738-2.623 0-1.788-.71-2.64-.708-.852-1.715-.853-1.014 0-1.754.885-.738.88-.739 2.545m8.348 4.634V.47h1.546v12.602zm10.194-2.94 1.601.2q-.38 1.402-1.401 2.173-1.024.774-2.616.774-2 0-3.176-1.232-1.172-1.236-1.172-3.461 0-2.303 1.186-3.578 1.186-1.27 3.078-1.27 1.83 0 2.993 1.246 1.158 1.246 1.158 3.507 0 .137-.007.412h-6.81q.088 1.506.853 2.306.763.8 1.908.8.852 0 1.45-.448.603-.447.955-1.429m-5.078-2.5h5.095q-.101-1.152-.584-1.729-.74-.895-1.916-.895-1.066 0-1.792.715-.725.715-.803 1.909" />
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
