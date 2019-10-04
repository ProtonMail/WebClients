import _ from 'lodash';

/* @ngInject */
function markedScroll() {
    const CACHE = {};
    const getMarked = () => CACHE.wrapper.querySelector('.conversation.marked');

    const follow = () => {
        if (!CACHE.wrapper || !CACHE.wrapper.offsetHeight) {
            // Not same wrapper of both modes
            const cols = document.getElementById('conversation-list-columns');
            CACHE.wrapper = cols || document.getElementById('wrapper');
        }

        _.defer(() => {
            const $marked = getMarked();
            CACHE.wrapper.scrollTop = $marked.offsetTop - CACHE.wrapper.offsetHeight / 1.5;
        });
    };
    const clear = () => (CACHE.wrapper = null);

    return { follow, clear };
}
export default markedScroll;
