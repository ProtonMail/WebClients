import { SERVER_FEATURES } from 'proton-shared/lib/constants';

export const isFeatureOn = (feature) => (features = 0) => !!(features & feature);
export const isSecureCoreEnabled = isFeatureOn(SERVER_FEATURES.SECURE_CORE);
