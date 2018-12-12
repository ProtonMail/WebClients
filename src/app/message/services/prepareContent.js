import _ from 'lodash';

import transformEscape from '../helpers/transformEscape';
import transformLinks from '../helpers/transformLinks';

/* @ngInject */
function prepareContent($injector, transformAttachements, transformRemote, transformEmbedded) {
    const filters = ['transformEmbedded', 'transformWelcome', 'transformBlockquotes', 'transformStylesheet'].map(
        (name) => ({
            name,
            action: $injector.get(name)
        })
    );

    filters.unshift({
        name: 'transformLinks',
        action: transformLinks
    });

    /**
     * Get the list of transoformation to perform
     *     => Blacklist everything via *
     * @param  {Array}  blacklist
     * @param  {Array}  whitelist
     * @return {Array}
     */
    const getTransformers = (blacklist = [], whitelist = []) => {
        // --force
        if (whitelist.length) {
            return filters.filter(({ name }) => whitelist.includes(name));
        }

        if (blacklist.includes('*')) {
            return [];
        }
        return filters.filter(({ name }) => !blacklist.includes(name));
    };

    function createParser(content, { isBlacklisted = false, action }) {
        const div = document.createElement('div');

        if (isBlacklisted) {
            div.innerHTML = getInput(content);
            return div;
        }

        // Escape All the things !
        return transformEscape(div, {
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

    return (content, message, { blacklist = [], whitelist = [], action } = {}) => {
        const transformers = getTransformers(blacklist, whitelist);
        const div = createParser(content, {
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
