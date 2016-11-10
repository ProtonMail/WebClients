angular.module('proton.message')
.factory('prepareContent', ($injector, transformAttachement, transformRemote) => {
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

    function parseRemote(content, message, { isBlacklisted = false, action }) {
        const div = document.createElement('div');

        if (isBlacklisted) {
            div.innerHTML = content;
            return div;
        }

        return transformRemote(div, message, {
            action, content
        });
    }

    return (content, message, { blacklist = [], action } = {}) => {

        const transformers = getTransformers(blacklist);
        const div = parseRemote(content, message, {
            action,
            isBlacklisted: blacklist.indexOf('transformRemote') > -1,
        });

        const body = transformers.reduceRight((html, transformer) => transformer.action(html, message, action), div);

        transformAttachement(body, message, action);

        return body.innerHTML;
    };
});
