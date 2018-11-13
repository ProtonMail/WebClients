/* @ngInject */
function needUpgrade(gettextCatalog, notification, userType) {
    const I18N = {
        UPGRADE: gettextCatalog.getString('Please upgrade to a paid plan to use this premium feature.', null, 'Info')
    };

    const sendNotification = () => notification.info(I18N.UPGRADE);

    function main({ notify = true } = {}) {
        if (userType().isFree) {
            notify && sendNotification();
            return true;
        }
    }

    main.notify = sendNotification;

    return main;
}
export default needUpgrade;
