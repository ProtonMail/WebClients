import _ from 'lodash';
import { CONSTANTS } from '../../constants';
import { getOS, getBrowser, getDevice } from '../../../helpers/browser';
import { toBase64 } from '../../../helpers/fileHelper';
import { downSize, toBlob } from '../../../helpers/imageHelper';

/* @ngInject */
function bugReportApi(Report, CONFIG, $state, authentication, gettextCatalog, networkActivityTracker, notification) {
    const { ROW_MODE, COLUMN_MODE, MESSAGE_VIEW_MODE, CONVERSATION_VIEW_MODE, CLIENT_TYPE, MAX_SIZE_SCREENSHOT } = CONSTANTS;
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

    const getClient = ({ ViewLayout = '', ViewMode = '' } = {}) => {
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
        const { Name = '', Addresses = [] } = authentication.user;
        const [{ Email = '' } = {}] = _.sortBy(Addresses, 'Order');

        return _.extend(getClient(authentication.user), {
            Resolution: `${window.innerHeight} x ${window.innerWidth}`,
            Title: `[Angular] Bug [${$state.$current.name}]`,
            Description: '',
            Username: Name,
            Email
        });
    };

    const toFormData = (parameters = {}) => {
        const formData = new FormData();
        const resize = (file) => toBase64(file).then((base64str) => downSize(base64str, MAX_SIZE_SCREENSHOT, file.type));
        const promises = _.reduce(parameters, (acc, value, key) => {
            // NOTE FileList instanceof Array => false
            if (value instanceof FileList || value instanceof Array) {
                for (let i = 0; i < value.length; i++) {
                    const file = value[i];
                    const promise = resize(file)
                        .then((base64str) => {
                            formData.append(file.name, toBlob(base64str), file.name);
                        });

                    acc.push(promise);
                }

                return acc;
            }

            value && formData.append(key, value);

            return acc;
        }, []);

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

    const crash = (error) => {
        const crashData = _.extend(getClient(authentication.user), {
            Debug: { state: $state.$current.name, error }
        });
        return Report.crash(crashData).catch(angular.noop);
    };

    return { getForm, report, getClient, crash, toFormData };
}
export default bugReportApi;
