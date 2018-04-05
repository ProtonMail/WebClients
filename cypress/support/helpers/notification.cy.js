const CLASSNAMES = {
    error: '.notification-danger',
    success: '.notification-success',
    info: '.notification-info'
};

const getClassName = (type = '') => CLASSNAMES[type] || '';
const selector = (type, item = '', index) => {
    const el = cy.get(`.proton-notification-template${getClassName(type)} ${item}`.trim());

    return !index && index !== 0 ? el : el.eq(index);
};

const display = (type) => (message, exist = true, index) => {
    selector(type).should(exist ? 'exist' : 'not.exist');
    exist && selector(type, 'span', index).contains(message);
};

module.exports = {
    success: display('success'),
    error: display('error'),
    info: display('info')
};
