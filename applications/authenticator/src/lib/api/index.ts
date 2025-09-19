import config from 'proton-authenticator/app/config';

import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import type { ApiEvent, ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';
import createApi from '@proton/shared/lib/api/createApi';

export * from './requests';

type ApiRef = { instance: ApiWithListener };
const apiRef = {} as ApiRef;

export const apiEvents = createPubSub<ApiEvent>();

const onApiEvent: ApiListenerCallback = (event) => {
    if (event.type === 'logout') apiRef.instance.UID = undefined;
    apiEvents.publish(event);
    return true;
};

export const resetAPI = () => {
    apiRef.instance?.removeEventListener(onApiEvent);
    apiRef.instance = createApi({ config });
    apiRef.instance.addEventListener(onApiEvent);
};

export const getApi = () => apiRef.instance;

resetAPI();
