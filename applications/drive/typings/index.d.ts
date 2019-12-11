declare module '*.svg' {
    const src: string;
    export default src;
}

declare module 'service-worker-loader!*' {
    const register: import('service-worker-loader/types').ServiceWorkerRegister;
    const ServiceWorkerNoSupportError: import('service-worker-loader/types').ServiceWorkerNoSupportError;
    const scriptUrl: import('service-worker-loader/types').ScriptUrl;
    export default register;
    export { ServiceWorkerNoSupportError, scriptUrl };
}

declare const PL_IS_STANDALONE: boolean;
