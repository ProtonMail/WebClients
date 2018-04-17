import _ from 'lodash';
import createMscScroller from '../../../helpers/mscScrollHelper';

/* @ngInject */
const sidebarLabels = () => ({
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarLabels.tpl.html'),
    link(scope, $el) {
        const mcsScroller = createMscScroller({ margin: 40, scrollBy: 30 });
        const el = $el[0];

        scope.scrollbarConfig = {
            advanced: {
                updateOnContentResize: true
            },
            scrollInertia: 0,
            scrollButtons: {
                enable: false
            },
            callbacks: {
                whileScrolling: function() {
                    mcsScroller.setScrollPosition(this.mcs.top);
                }
            }
        };

        /**
         * For some reason ng-scrollbars doesn't update when the content is resized.
         * Force update it here.
         * Related to issue https://github.com/ProtonMail/Angular/issues/6260.
         */
        function onResize() {
            scope.$applyAsync(() => scope.updateScrollbar('update'));
        }

        function dragEnter(e) {
            // Only when a label is entered when dragging.
            if (e.target.dataset.ptDropzoneItemType !== 'label') {
                return;
            }
            /**
             * Get the height of the scroller list (need to get it here because it can change on resize and
             * the height hasn't been calculated when the template is initialized.
             */
            const { height } = el.getBoundingClientRect();
            // Get the new scroll value.
            const sy = mcsScroller.scroll(e.target.offsetTop, height);
            if (sy !== undefined) {
                scope.$applyAsync(() => scope.updateScrollbar('scrollTo', sy));
            }
        }

        const debouncedDe = _.debounce(dragEnter, 250);

        el.addEventListener('dragenter', debouncedDe);
        window.addEventListener('resize', onResize);

        scope.$on('$destroy', () => {
            el.removeEventListener('dragenter', debouncedDe);
            window.removeEventListener('resize', onResize);
        });
    }
});
export default sidebarLabels;
