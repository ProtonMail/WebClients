angular.module('proton.message')
.factory('prepareContent', function($injector, transformLinks, transformImages, transformWelcome, transformBlockquotes, transformAttachement) {
    return function(content, message, blacklist = []) {
        const div = document.createElement('div');
        const filters = ['transformLinks', 'transformImages', 'transformWelcome', 'transformBlockquotes'].map((name) => ({ name, action: $injector.get(name) }));
        const transformers = filters.filter(({name}) => blacklist.indexOf(name) === -1);

        div.innerHTML = content;

        const output =  transformers.reduceRight((html, transformer) => transformer.action(html, message), div);

        transformAttachement(output, message);
        return output.innerHTML;
    };
});
