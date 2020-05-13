declare module '*.svg' {
    const src: string;
    export default src;
}

declare module '*.png' {
    const src: string;
    export default src;
}

declare module 'service-worker-loader*' {
    import {
        ServiceWorkerRegister,
        ScriptUrl as scriptUrl,
        ServiceWorkerNoSupportError
    } from 'service-worker-loader/types.d';
    const register: ServiceWorkerRegister;
    export default register;
    export { ServiceWorkerNoSupportError, scriptUrl };
}

declare module 'ical.js' {
    const value: any;
    export default value;
}

declare const PL_IS_STANDALONE: boolean;
