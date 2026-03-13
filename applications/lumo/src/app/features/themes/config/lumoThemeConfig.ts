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
        name: 'saint-patricks-day',
        startDate: new Date('2026-03-13'),
        endDate: new Date('2026-03-18'),
        getAnimationDark: () =>
            import(
                /* webpackChunkName: "lumo-saint-patricks-day-dark-animation" */
                '../assets/saintPatricksDay/dark.json'
            ),
        getAnimationLight: () =>
            import(
                /* webpackChunkName: "lumo-saint-patricks-day-light-animation" */
                '../assets/saintPatricksDay/light.json'
            ),
        getPromptText: () => c('collider_2025:Prompt').t`How does the world celebrate Saint Patrick's Day?`,
        icon: '🍀',
    },
];
