/**
 * Upsell components for Lumo Plus
 *
 * This module exports composed upsell components that handle different contexts
 * throughout the application. All components use the `useUpsellState` hook to
 * determine visibility and appropriate actions based on user state.
 */

// Composed components
export { LumoChatHistoryUpsell } from './composed/LumoChatHistoryUpsell';
export { LumoSettingsPanelUpsell } from './composed/LumoSettingsPanelUpsell';
export { LumoSidebarUpsell } from './composed/LumoSidebarUpsell';
export { default as LumoNavbarUpsell } from './composed/LumoNavbarUpsell';
export { default as LumoComposerToggleUpsell } from './composed/LumoComposerToggleUpsell';
export { default as LumoTierErrorUpsell } from './composed/LumoTierErrorUpsellButtons';

// Primitives (export if needed by consumers)
export { default as GetLumoPlusButton } from './primitives/GetLumoPlusButton';
export { GetLumoPlusContent } from './primitives/GetLumoPlusContent';
export { SubscriptionPanel } from './primitives/SubscriptionPanel';
