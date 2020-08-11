declare module '*.png';

declare module 'service-worker-loader*' {
    import {
        ServiceWorkerRegister,
        ScriptUrl as scriptUrl,
        ServiceWorkerNoSupportError,
    } from 'service-worker-loader/types.d';
    const register: ServiceWorkerRegister;
    export default register;
    export { ServiceWorkerNoSupportError, scriptUrl };
}
