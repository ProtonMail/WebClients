angular.module('proton.message')
.factory('prepareContent', function($injector, transformAttachement, transformRemote) {
    return function(content, message, blacklist = []) {
        const div = document.createElement('div');
        const filters = ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes'].map((name) => ({ name, action: $injector.get(name) }));
        const transformers = filters.filter(({name}) => blacklist.indexOf(name) === -1);

        div.innerHTML = transformRemote(content, message);

        const output =  transformers.reduceRight((html, transformer) => transformer.action(html, message), div);

        transformAttachement(output, message);
        return output.innerHTML;
    };
});
