/* @ngInject */
function incomingModel(notification, gettextCatalog, IncomingDefault, networkActivityTracker) {
    const I18N = {
        ADD_SUCCESS: gettextCatalog.getString('Spam Filter Added', null, 'Filters'),
        UPDATE_SUCCESS: gettextCatalog.getString('Spam Filter Updated', null, 'Filters'),
        DELETE_SUCCESS: gettextCatalog.getString('Spam Filter Deleted', null, 'Filters')
    };

    const get = (config) => {
        const promise = IncomingDefault.get(config).then(({ data = {} }) => {
            return data.IncomingDefaults;
        });
        networkActivityTracker.track(promise);
        return promise;
    };

    const update = (ID, Location) => {
        const promise = IncomingDefault.update({ ID, Location }).then(({ data = {} }) => {
            notification.success(I18N.UPDATE_SUCCESS);
            return data.IncomingDefault;
        });
        networkActivityTracker.track(promise);
        return promise;
    };

    const remove = (ID) => {
        const promise = IncomingDefault.delete({ IDs: [ID] }).then(({ data = {} }) => {
            notification.success(I18N.DELETE_SUCCESS);
            return data.IncomingDefault;
        });
        networkActivityTracker.track(promise);
        return promise;
    };

    const create = (params) => {
        const promise = IncomingDefault.add(params).then(({ data = {} }) => {
            notification.success(I18N.ADD_SUCCESS);
            return data.IncomingDefault;
        });
        networkActivityTracker.track(promise);
        return promise;
    };

    return { get, update, remove, create };
}
export default incomingModel;
