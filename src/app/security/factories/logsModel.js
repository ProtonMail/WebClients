import _ from 'lodash';

/* @ngInject */
function logsModel(
    networkActivityTracker,
    Logs,
    downloadFile,
    confirmModal,
    gettextCatalog,
    settingsApi,
    activeSessionsModel,
    notification
) {
    const I18N = {
        clear: {
            title: gettextCatalog.getString('Clear', null, 'Title'),
            message: gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info'),
            updated: gettextCatalog.getString('Logging preference updated', null, 'Dashboard/security'),
            success: gettextCatalog.getString('Logs cleared', null, "Clear user's logs (security)")
        },
        logging: {
            success: gettextCatalog.getString('Logging preference updated', null, 'Dashboard/security')
        }
    };

    const MAP_LOGGING = {
        disable: 0,
        basic: 1,
        advanced: 2
    };

    const load = () => networkActivityTracker.track(Logs.get());

    /**
     * Create a CSV from a list of logs, then download it as a file logs.csv
     * @param  {Array} options.logs List of logs from the API
     * @return {void}
     */
    const download = ({ logs }) => {
        const data = _.reduce(
            logs,
            (acc, { Event, Time, IP }) => {
                acc.push(`${Event},${moment(Time * 1000)},${IP}`);
                return acc;
            },
            [['Event', 'Time', 'IP'].join(',')]
        );

        const filename = 'logs.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        downloadFile(blob, filename);
    };

    /**
     * Helper to trigger an action if a user clicks on the confirm button inside the modal
     * @param  {Function} confirm action to trigger
     * @param  {Object} i18n    Translations
     * @return {Promise}
     */
    const askConfirm = (confirm, i18n = {}) => {
        return new Promise((resolve) => {
            confirmModal.activate({
                params: {
                    title: I18N.clear.title,
                    message: I18N.clear.message,
                    ...i18n,
                    confirm() {
                        // We bind the callback to close the modal only when we want to inside this function
                        confirm(() => confirmModal.deactivate('confirm'));
                    },
                    hookClose: resolve
                }
            });
        });
    };

    /**
     * Clear the logs if the user wants to.
     * @return {Promise}
     */
    const clear = () => {
        const confirmation = (cb) => {
            const promise = Logs.clear().then(() => {
                notification.success(I18N.clear.success);
            });
            networkActivityTracker.track(promise);
            cb();
        };
        return askConfirm(confirmation);
    };

    /**
     * Change the LogAuth value from settings
     *     - disable: 0 (You know nothing Jon Snow)
     *     - active: 1 (basic logs informations)
     *     - advanced: 2 (full logs)
     * @param  {String} value disable/active/advanced
     * @return {Promise}
     */
    const setLogging = (value) => {
        const LogAuth = MAP_LOGGING[value];

        if (LogAuth === 0) {
            const confirmation = (cb) => {
                const promise = settingsApi.setLogging({ LogAuth }).then(() => {
                    activeSessionsModel.clear();
                    notification.success(I18N.clear.updated);
                    cb();
                });
                networkActivityTracker.track(promise);
            };
            return askConfirm(confirmation);
        }

        const promise = settingsApi.setLogging({ LogAuth }).then(() => {
            notification.success(I18N.logging.success);
        });

        return networkActivityTracker.track(promise);
    };

    return {
        load,
        download,
        clear,
        setLogging
    };
}

export default logsModel;
