import { isManagedByMozilla } from './helpers';

const format = (subscription = {}) => {
    return {
        ...subscription,
        isManagedByMozilla: isManagedByMozilla(subscription)
    };
};

export default format;
