import { useSyncExternalStore } from 'react';

type Listener = () => void;

const listeners = new Set<Listener>();
let organizationViewEnabled = false;
let organizationMemberViewEnabled = false;
let creditBalanceOverride: number | null = null;
let emptyUsageEnabled = false;
let apiAccessDeniedEnabled = false;

const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getOrganizationViewSnapshot = () => organizationViewEnabled;

/**
 * Debug-only presentation override. Consumers must use this solely to reveal
 * mocked organization UI; it does not grant organization permissions.
 */
export const setDebugApiOrganizationView = (enabled: boolean) => {
    organizationViewEnabled = enabled;
    if (enabled) {
        organizationMemberViewEnabled = false;
        apiAccessDeniedEnabled = false;
    }
    listeners.forEach((listener) => listener());
};

export const useDebugApiOrganizationView = () =>
    useSyncExternalStore(subscribe, getOrganizationViewSnapshot, getOrganizationViewSnapshot);

const getOrganizationMemberViewSnapshot = () => organizationMemberViewEnabled;

export const setDebugApiOrganizationMemberView = (enabled: boolean) => {
    organizationMemberViewEnabled = enabled;
    apiAccessDeniedEnabled = false;
    if (enabled) {
        organizationViewEnabled = false;
    }
    listeners.forEach((listener) => listener());
};

export const useDebugApiOrganizationMemberView = () =>
    useSyncExternalStore(subscribe, getOrganizationMemberViewSnapshot, getOrganizationMemberViewSnapshot);

const getCreditBalanceSnapshot = () => creditBalanceOverride;

/**
 * Debug-only account credit override in base currency units (cents for USD).
 * A null value uses the real account balance.
 */
export const setDebugApiCreditBalance = (balance: number | null) => {
    creditBalanceOverride = balance === null ? null : Math.max(0, Math.round(balance));
    listeners.forEach((listener) => listener());
};

export const useDebugApiCreditBalance = () =>
    useSyncExternalStore(subscribe, getCreditBalanceSnapshot, getCreditBalanceSnapshot);

const getEmptyUsageSnapshot = () => emptyUsageEnabled;

export const setDebugApiEmptyUsage = (enabled: boolean) => {
    emptyUsageEnabled = enabled;
    listeners.forEach((listener) => listener());
};

export const useDebugApiEmptyUsage = () =>
    useSyncExternalStore(subscribe, getEmptyUsageSnapshot, getEmptyUsageSnapshot);

const getApiAccessDeniedSnapshot = () => apiAccessDeniedEnabled;

export const setDebugApiAccessDenied = (enabled: boolean) => {
    apiAccessDeniedEnabled = enabled;
    if (enabled) {
        organizationMemberViewEnabled = true;
        organizationViewEnabled = false;
    }
    listeners.forEach((listener) => listener());
};

export const useDebugApiAccessDenied = () =>
    useSyncExternalStore(subscribe, getApiAccessDeniedSnapshot, getApiAccessDeniedSnapshot);
