import { PublicAppContext } from './state-machine/PublicAppContext';
import { usePublicAppServices } from './state-machine/PublicAppServices';
import { requireCrypto } from './state-machine/runLogin';

/** Loads the crypto worker ahead of a submit, and starts the unauthenticated session a sign-in or signup needs. */
export const usePublicAppAuth = () => {
    const { unauthenticatedApi } = usePublicAppServices();
    const publicApp = PublicAppContext.useActorRef();
    return {
        onPreload: () => publicApp.send({ type: 'crypto.requested' }),
        // The crypto worker must be loaded when a signup, login or reset submits
        onPreSubmit: () => requireCrypto(publicApp),
        onStartAuth: () => unauthenticatedApi.startUnAuthFlow(),
    };
};

// True until apps have been deployed to support key-less accounts
export const setupVPN = true;
