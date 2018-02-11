import _ from 'lodash';

/* @ngInject */
function markedScroll() {
    const CACHE = {};
    const getMarked = () => CACHE.wrapper.querySelector('.conversation.marked');

    const follow = () => {
        if (!CACHE.wrapper) {
            CACHE.wrapper = document.body.querySelector('.conversation-wrapper');
        }

        _.defer(() => {
            const $marked = getMarked();

            // Focus the checkbox to toggle it with the "space" key
            $marked.querySelector('.customCheckbox-input').focus();

            CACHE.wrapper.scrollTop = $marked.offsetTop - CACHE.wrapper.offsetHeight / 2;
        });
    };
    const clear = () => (CACHE.wrapper = null);

    return { follow, clear };
}
export default markedScroll;
