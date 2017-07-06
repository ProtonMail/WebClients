angular.module('proton.conversation')
    .factory('markedScroll', () => {

        const CACHE = {};
        const getMarked = () => CACHE.wrapper.querySelector('.conversation.marked');

        const follow = () => {

            if (!CACHE.wrapper) {
                CACHE.wrapper = document.body.querySelector('.conversation-wrapper');
            }

            _rAF(() => {
                const $marked = getMarked();
                CACHE.wrapper.scrollTop = $marked.offsetTop - CACHE.wrapper.offsetHeight / 2;
            });

        };
        const clear = () => (CACHE.wrapper = null);

        return { follow, clear };
    });
