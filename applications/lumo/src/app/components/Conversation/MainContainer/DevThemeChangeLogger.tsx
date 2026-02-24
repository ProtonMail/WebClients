import {useEffect, useState} from 'react';

import {useTheme} from '@proton/components';
import {ThemeModeSetting, ThemeTypes} from '@proton/shared/lib/themes/constants';

import {useLumoTheme} from '../../../providers';

const ThemeChangeLogger = () => {
    const { addListener, information } = useTheme();
    const { theme: lumoTheme } = useLumoTheme();
    const [changeHistory, setChangeHistory] = useState<string[]>([]);

    // Track main theme changes
    useEffect(() => {
        return addListener((newSettings) => {
            const timestamp = new Date().toLocaleTimeString();
            const modeText = {
                [ThemeModeSetting.Auto]: 'Auto',
                [ThemeModeSetting.Light]: 'Light',
                [ThemeModeSetting.Dark]: 'Dark',
            }[newSettings.Mode];

            const themeType =
                newSettings.Mode === ThemeModeSetting.Dark ? newSettings.DarkTheme : newSettings.LightTheme;

            const logEntry = `${timestamp}: Main Theme → ${modeText} mode (${ThemeTypes[themeType] || themeType})`;
            setChangeHistory((prev) => [...prev.slice(-9), logEntry]); // Keep last 10 entries
        });
    }, [addListener]);

    // Track Lumo theme changes
    useEffect(() => {
        const timestamp = new Date().toLocaleTimeString();
        const lumoThemeName = lumoTheme === ThemeTypes.LumoDark ? 'LumoDark' : 'LumoLight';
        const logEntry = `${timestamp}: Lumo Theme → ${lumoThemeName} (${lumoTheme})`;

        setChangeHistory((prev) => [...prev.slice(-9), logEntry]); // Keep last 10 entries
    }, [lumoTheme]);

    const getCurrentLumoThemeName = () => {
        return lumoTheme === ThemeTypes.LumoDark ? 'LumoDark' : 'LumoLight';
    };

    return (
        <div
            style={{
                padding: '16px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                margin: '16px',
                backgroundColor: lumoTheme === ThemeTypes.LumoDark ? '#2a2a2a' : '#f9f9f9',
                color: lumoTheme === ThemeTypes.LumoDark ? '#ffffff' : '#000000',
            }}
        >
            <h3>🎨 Theme Debug Info</h3>

            <div style={{ marginBottom: '16px' }}>
                <strong>Main Theme:</strong> {information.label} (ID: {information.theme})<br />
                <strong>Lumo Theme:</strong> {getCurrentLumoThemeName()} (ID: {lumoTheme})<br />
                <strong>is Lumo Dark:</strong> {lumoTheme === ThemeTypes.LumoDark ? 'Yes' : 'No'}
                <br />
                {/* <strong>Color Scheme:</strong> {information.colorScheme === 0 ? 'Dark' : 'Light'} */}
            </div>

            <h4>📋 Change History (Last 10):</h4>
            <div
                style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                }}
            >
                {changeHistory.length === 0 ? (
                    <p style={{ fontStyle: 'italic' }}>No theme changes detected yet. Try toggling themes!</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {changeHistory.map((entry, index) => (
                            <li
                                key={index}
                                style={{
                                    padding: '4px 0',
                                    borderBottom: '1px solid #444',
                                }}
                            >
                                {entry}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ThemeChangeLogger;
