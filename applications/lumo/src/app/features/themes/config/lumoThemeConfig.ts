/**
 * Configuration for special Lumo themes
 * Each theme defines its date range and animation loaders for light/dark variants
 */
import { c } from 'ttag';

export interface LumoThemeConfig {
    name: string;
    startDate: Date;
    endDate: Date;
    getAnimationDark: () => Promise<{ default: object }>;
    getAnimationLight: () => Promise<{ default: object }>;
    getPromptText: () => string;
    icon: string;
    priority?: number; // Optional: for handling overlapping themes (higher = more priority)
}

/**
 * Registry of special Lumo themes for Lumo Cat component
 * Add new themes here to enable them automatically
 */
export const LUMO_SPECIAL_THEMES: LumoThemeConfig[] = [
    {
        name: 'spring-solstice',
        startDate: new Date('2026-03-19'),
        endDate: new Date('2026-03-22'),
        getAnimationDark: () =>
            import(
                /* webpackChunkName: "lumo-spring-solstice-dark-animation" */
                '../assets/springSolstice/dark.json'
            ),
        getAnimationLight: () =>
            import(
                /* webpackChunkName: "lumo-spring-solstice-light-animation" */
                '../assets/springSolstice/light.json'
            ),
        getPromptText: () => c('collider_2025:Prompt').t`How does the world celebrate the Spring Equinox?`,
        icon: '🦋',
    },
];
