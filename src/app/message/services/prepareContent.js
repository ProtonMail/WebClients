angular.module('proton.message')
.factory('prepareContent', ($injector, transformAttachement, transformRemote, transformEscape) => {
    const filters = [
        'transformBase',
        'transformLinks',
        'transformEmbedded',
        'transformWelcome',
        'transformBlockquotes'
    ].map((name) => ({ name, action: $injector.get(name) }));

    /**
     * Get the list of transoformation to perform
     *     => Blacklist everything via *
     * @param  {Array}  blacklist
     * @return {Array}
     */
    const getTransformers = (blacklist = []) => {
        if (blacklist.indexOf('*') > -1) {
            return [];
        }
        return filters.filter(({ name }) => blacklist.indexOf(name) === -1);
    };

    function createParser(content, message, { isBlacklisted = false, action }) {
        const div = document.createElement('div');

        if (isBlacklisted) {
            div.innerHTML = content;
            return div;
        }

        // Escape All the things !
        return transformEscape(div, message, {
            action, content
        });
    }

    return (content, message, { blacklist = [], action } = {}) => {

        const transformers = getTransformers(blacklist);
        const div = createParser(content, message, {
            action,
            isBlacklisted: _.contains(blacklist, 'transformRemote')
        });

        const body = transformers.reduceRight((html, transformer) => transformer.action(html, message, action), div);

        if (!_.contains(blacklist, 'transformAttachement')) {
            transformAttachement(body, message, action);
        }

        return transformRemote(body, message, { action }).innerHTML;
    };
});
