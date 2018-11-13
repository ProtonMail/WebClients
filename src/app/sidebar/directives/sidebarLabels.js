import _ from 'lodash';

import createMscScroller from '../../../helpers/mscScrollHelper';

/* @ngInject */
const sidebarLabels = (dispatchers, manageContactGroup, needUpgrade) => ({
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarLabels.tpl.html'),
    link(scope, el, { type }) {
        const { on, unsubscribe: unsubscribeHook } = dispatchers();
        const mcsScroller = createMscScroller({ margin: 40, scrollBy: 30 });

        const unsubscribe = [unsubscribeHook];

        scope.scrollbarConfig = {
            advanced: {
                updateOnContentResize: true
            },
            scrollInertia: 0,
            scrollButtons: {
                enable: false
            },
            callbacks: {
                whileScrolling() {
                    mcsScroller.setScrollPosition(this.mcs.top);
                }
            }
        };

        /**
         * For some reason ng-scrollbars doesn't update when the content is resized.
         * Force update it here.
         * Related to issue https://github.com/ProtonMail/Angular/issues/6260.
         */
        const onResize = () => {
            _rAF(() => scope.$applyAsync(() => scope.updateScrollbar('update')));
        };

        const onVisibilitychange = onResize;

        const dragEnter = (e) => {
            // Only when a label is entered when dragging.
            if (e.target.dataset.ptDropzoneItemType !== 'label') {
                return;
            }
            /**
             * Get the height of the scroller list (need to get it here because it can change on resize and
             * the height hasn't been calculated when the template is initialized.
             */
            const { height } = el[0].getBoundingClientRect();
            // Get the new scroll value.
            const sy = mcsScroller.scroll(e.target.offsetTop, height);
            if (sy !== undefined) {
                scope.$applyAsync(() => scope.updateScrollbar('scrollTo', sy));
            }
        };

        on('labelsModel', (e, { type }) => {
            if (type === 'cache.update') {
                onResize();
            }
        });

        const debouncedDe = _.debounce(dragEnter, 250);

        if (type === 'groups') {
            const onClick = (e) => {
                if (e.target.nodeName === 'A' || e.currentTarget.nodeName === 'A') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!needUpgrade()) {
                        manageContactGroup.edit(null, e.target.getAttribute('data-pt-dropzone-item'));
                    }
                }
            };
            el.on('click', onClick);
            unsubscribe.push(() => el.off('click', onClick));
        }

        el[0].addEventListener('dragenter', debouncedDe);
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibilitychange); // Required to avoid #7455

        unsubscribe.push(() => {
            el[0].removeEventListener('dragenter', debouncedDe);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', onVisibilitychange);
        });

        scope.$on('$destroy', () => {
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });
    }
});
export default sidebarLabels;
