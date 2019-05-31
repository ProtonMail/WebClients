import xhr from 'proton-shared/lib/fetch/fetch';
import configureApi from 'proton-shared/lib/api';

export default ({ CLIENT_ID, CLIENT_SECRET, APP_VERSION, API_VERSION, API_URL }) => (UID) => {
    return configureApi({
        xhr,
        UID,
        API_URL,
        CLIENT_ID,
        CLIENT_SECRET,
        API_VERSION,
        APP_VERSION
    });
};
