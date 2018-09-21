import { isHTML } from '../../../helpers/domHelper';

/* @ngInject */
function notification() {
    const CONFIG = {
        classNames: {
            error: 'notification-danger',
            success: 'notification-success',
            info: 'notification-info'
        }
    };

    this.typeClasses = (config = {}) => ({ ...CONFIG.classNames, ...config });
    this.duration = (value = 6000) => (CONFIG.duration = value);
    this.template = (value = '') => (CONFIG.template = value);

    this.$get = [
        'notify',
        (notify) => {
            const action = (type) => (input, options = {}) => {
                const message = input instanceof Error ? input.message : input;
                options.classes = `${options.classes || ''} ${CONFIG.classNames[type]}`.trim();

                const htmlInfo = isHTML(message);
                // If it is a html string, double check that it is actually wrapped in one element. Otherwise wrap it in a div.
                if (htmlInfo.isHtml && !options.messageTemplate) {
                    options.messageTemplate = htmlInfo.isWrapped ? message : `<div>${message}</div>`;
                }

                type === 'error' && (options.duration = 10000);
                notify({ message, ...options });
            };

            const config = {
                position: 'center',
                maximumOpen: 5,
                duration: 6000
            };

            CONFIG.template && (config.templateUrl = CONFIG.template);

            notify.config(config);

            return {
                success: action('success'),
                error: action('error'),
                info: action('info')
            };
        }
    ];
}
export default notification;
