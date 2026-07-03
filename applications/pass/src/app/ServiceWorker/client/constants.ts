import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const ServiceWorkerClientID = uniqueId(16);
export const ServiceWorkerEnabled = 'serviceWorker' in navigator;
