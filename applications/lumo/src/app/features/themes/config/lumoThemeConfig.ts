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
        name: 'valentines',
        startDate: new Date('2026-02-11'),
        endDate: new Date('2026-02-15'), // Day after Valentine's Day
        getAnimationDark: () =>
            import(
                /* webpackChunkName: "lumo-valentines-dark-animation" */
                '../assets/valentines/dark.json'
            ),
        getAnimationLight: () =>
            import(
                /* webpackChunkName: "lumo-valentines-light-animation" */
                '../assets/valentines/light.json'
            ),
        getPromptText: () => c('collider_2025:Prompt').t`How the world celebrates Valentine's Day`,
        icon: '💕',
    },
];
