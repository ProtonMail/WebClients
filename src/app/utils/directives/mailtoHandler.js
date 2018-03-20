/* @ngInject */
function mailtoHandler(dispatchers, sanitize, messageModel, mailUtils) {
    const { dispatcher } = dispatchers(['composer.new']);
    const dispatch = (type, data = {}) => dispatcher['composer.new'](type, data);

    const onClick = (e) => {
        // We only handle anchor that begins with `mailto:`
        if (e.target.nodeName === 'A' && (e.target.getAttribute('href') || '').toLowerCase().startsWith('mailto:')) {
            e.preventDefault();

            const message = { ...messageModel(), ...mailUtils.mailtoParser(e.target.getAttribute('href')) };

            // Open the composer with the given mailto address
            dispatch('new', { message });
        }
    };

    return {
        link(scope) {
            document.body.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                document.body.removeEventListener('click', onClick);
            });
        }
    };
}
export default mailtoHandler;
