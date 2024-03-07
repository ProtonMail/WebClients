export * from '@proton/pass/globals.d';

declare global {
    interface Window {
        registerPassElements?: (config: PassElementsConfig) => void;
    }
}
