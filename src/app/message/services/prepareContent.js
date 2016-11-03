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

    return (content, message, blacklist = []) => {

        const div = document.createElement('div');
        const transformers = getTransformers(blacklist);

        if (blacklist.indexOf('transformRemote') > -1) {
            div.innerHTML = content;
        } else {
            div.innerHTML = transformRemote(content, message);
        }

        const body = transformers.reduceRight((html, transformer) => transformer.action(html, message), div);

        transformAttachement(body, message);

        return body.innerHTML;
    };
});
