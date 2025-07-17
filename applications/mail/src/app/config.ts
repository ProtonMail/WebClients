import { getProtonConfig } from '@proton/shared/lib/interfaces/config';

export default getProtonConfig({
    // TODO: remove this once the Message.images is fixed
    API_URL: '/api',
});
