angular.module('proton.message')
.factory('prepareContent', ($injector, transformAttachement, transformRemote) => {
    const filters = [
        'transformLinks',
        'transformEmbedded',
        'transformWelcome',
        'transformBlockquotes'
    ].map((name) => ({ name, action: $injector.get(name) }));

    return (content, message, blacklist = []) => {
        const div = document.createElement('div');
        const transformers = filters.filter(({ name }) => blacklist.indexOf(name) === -1);

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
