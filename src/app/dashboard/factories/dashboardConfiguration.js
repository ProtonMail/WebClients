/* @ngInject */
function dashboardConfiguration() {
    const CONFIGURATION = {
        free: {}, // Store free addons
        plus: {}, // Store plus addons
        professional: {} // Store professional addons
    };

    const cycle = () => CONFIGURATION.cycle;
    const currency = () => CONFIGURATION.currency;
    const get = () => angular.copy(CONFIGURATION);
    const set = (key, value) => (CONFIGURATION[key] = value);
    const addon = (plan, addon, value) => (CONFIGURATION[plan][addon] = value);

    return { cycle, currency, get, set, addon };
}
export default dashboardConfiguration;
