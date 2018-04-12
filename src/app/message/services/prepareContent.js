import _ from 'lodash';

/* @ngInject */
function prepareContent($injector, transformAttachements, transformRemote, transformEscape, transformEmbedded) {
    const filters = [
        'transformLinks',
        'transformEmbedded',
        'transformWelcome',
        'transformBlockquotes',
        'transformStylesheet'
    ].map((name) => ({
        name,
        action: $injector.get(name)
    }));

    /**
     * Get the list of transoformation to perform
     *     => Blacklist everything via *
     * @param  {Array}  blacklist
     * @return {Array}
     */
    const getTransformers = (blacklist = []) => {
        if (blacklist.includes('*')) {
            return [];
        }
        return filters.filter(({ name }) => !blacklist.includes(name));
    };

    function createParser(content, message, { isBlacklisted = false, action }) {
        const div = document.createElement('div');

        if (isBlacklisted) {
            div.innerHTML = getInput(content);
            return div;
        }

        // Escape All the things !
        return transformEscape(div, message, {
            action,
            content,
            isDocument: typeof content !== 'string'
        });
    }

    function getInput(input) {
        if (typeof input === 'string') {
            return input;
        }
        return input.querySelector('body').innerHTML;
    }

    return (content, message, { blacklist = [], action } = {}) => {
        const transformers = getTransformers(blacklist);
        const div = createParser(content, message, {
            action,
            isBlacklisted: _.includes(blacklist, 'transformRemote')
        });

        const body = transformers.reduceRight(
            (html, transformer) => transformer.action(html, message, { action }),
            div
        );

        if (!blacklist.includes('*') && !_.includes(blacklist, 'transformAttachements')) {
            transformAttachements(body, message, { action });
        }

        // For a draft we try to load embedded content if we can
        if (/^reply|forward/.test(action)) {
            transformEmbedded(body, message, { action });
        }

        return transformRemote(body, message, { action }).innerHTML;
    };
}
export default prepareContent;
