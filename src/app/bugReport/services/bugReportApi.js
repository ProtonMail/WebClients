import _ from 'lodash';

import {
    ROW_MODE,
    COLUMN_MODE,
    MESSAGE_VIEW_MODE,
    CONVERSATION_VIEW_MODE,
    CLIENT_TYPE,
    MAX_SIZE_SCREENSHOT
} from '../../constants';
import CONFIG from '../../config';
import { getOS, getBrowser, getDevice } from '../../../helpers/browser';
import { toBase64 } from '../../../helpers/fileHelper';
import { downSize, toBlob } from '../../../helpers/imageHelper';

Raven.config(CONFIG.sentry.sentry, {
    release: CONFIG.sentry.release
}).install();
Raven.setTagsContext({
    appVersion: CONFIG.app_version
});

/* @ngInject */
function bugReportApi(
    Report,
    $state,
    addressesModel,
    authentication,
    gettextCatalog,
    networkActivityTracker,
    notification
) {
    const MAP_MODE = {
        layout: {
            [ROW_MODE]: 'row',
            [COLUMN_MODE]: 'column'
        },
        view: {
            [MESSAGE_VIEW_MODE]: 'row',
            [CONVERSATION_VIEW_MODE]: 'column'
        }
    };

    const getViewLayout = (type) => MAP_MODE.layout[type] || 'unknown';
    const getViewMode = (type) => MAP_MODE.view[type] || 'undefined';

    const getClient = ({ ViewLayout = '', ViewMode = '' } = authentication.user) => {
        const os = getOS();
        const browser = getBrowser();
        const device = getDevice();
        return {
            OS: os.name,
            OSVersion: os.version || '',
            Browser: browser.name,
            BrowserVersion: browser.version,
            Client: 'Angular',
            ClientVersion: CONFIG.app_version,
            ClientType: CLIENT_TYPE,
            ViewLayout: getViewLayout(ViewLayout),
            ViewMode: getViewMode(ViewMode),
            DeviceName: device.vendor,
            DeviceModel: device.model
        };
    };

    /**
     * Generate the configuration for the main form
     * @return {Object}
     */
    const getForm = () => {
        const { Name = '' } = authentication.user;
        const [{ Email = '' } = {}] = _.sortBy(addressesModel.get(), 'Order');

        return {
            ...getClient(),
            Resolution: `${window.innerHeight} x ${window.innerWidth}`,
            Title: `[Angular] Bug [${$state.$current.name}]`,
            Description: '',
            Username: Name,
            Email
        };
    };

    const resize = (file) => {
        return toBase64(file).then((base64str) => downSize(base64str, MAX_SIZE_SCREENSHOT, file.type));
    };

    const toFormData = (parameters = {}) => {
        const { promises, formData } = _.reduce(
            parameters,
            (acc, value, key) => {
                // NOTE FileList instanceof Array => false
                if (value instanceof FileList || value instanceof Array) {
                    for (let i = 0; i < value.length; i++) {
                        const file = value[i];
                        const promise = resize(file).then((base64str) => {
                            acc.formData.append(file.name, toBlob(base64str), file.name);
                        });

                        acc.promises.push(promise);
                    }

                    return acc;
                }

                acc.formData.append(key, value);

                return acc;
            },
            { promises: [], formData: new FormData() }
        );

        return Promise.all(promises)
            .then(() => formData)
            .catch(() => formData);
    };

    /**
     * Send the form to the server
     * @param  {Object} form FormData from the user
     * @return {Promise}
     */
    const send = async (form) => {
        await Report.bug(form);
        notification.success(gettextCatalog.getString('Bug reported', null, 'Bug report successfully'));
    };

    /**
     * Create a new report, upload the screenshot if we have to then send;
     * @param  {Object} form       FormData from the user
     * @param  {String} screenshot Screenshot as a base64
     * @return {Promise}
     */
    const report = (form) => {
        const promise = send(form);
        networkActivityTracker.track(promise);
        return promise;
    };

    const crash = async (error) => {
        const crashData = {
            ...getClient(),
            Debug: { state: $state.$current.name, error }
        };
        Raven.setUserContext();
        Raven.setUserContext(crashData);
        Raven.captureException(error, { appVersion: CONFIG.app_version });
    };

    const phishing = (message) => {
        const { ID: MessageID, MIMEType } = message;
        const Body = message.getDecryptedBody();
        // NOTE MIMEType can equals 'multipart/mixed'

        return Report.phishing({
            MessageID,
            Body,
            MIMEType: MIMEType === 'text/plain' ? 'text/plain' : 'text/html' // Accept only 'text/plain' / 'text/html'
        });
    };

    return { getForm, report, getClient, crash, toFormData, phishing };
}
export default bugReportApi;
