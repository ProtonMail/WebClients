angular.module('proton.elements')
    .directive('movedPanel', ($state, authentication, gettextCatalog, tools) => {
        const I18N = {
            inluceMoved: gettextCatalog.getString('Include moved', null, 'Link'),
            hideMoved: gettextCatalog.getString('Hide moved', null, 'Link')
        };
        const MAP = {
            sent: {
                text: I18N.inluceMoved,
                route: 'secured.allSent'
            },
            allSent: {
                text: I18N.hideMoved,
                route: 'secured.sent'
            },
            drafts: {
                text: I18N.inluceMoved,
                route: 'secured.allDrafts'
            },
            allDrafts: {
                text: I18N.hideMoved,
                route: 'secured.drafts'
            }
        };

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: `
            <div class="movedPanel-container">
                <a class="movedPanel-link"></a>
                <a class="movedPanel-help" href="TODO" target="_blank">
                    <i class="movedPanel-icon fa fa-info-circle"></i>
                </a>
            </div>
            `,
            link(scope, element) {
                const current = tools.filteredState();
                const $link = element.find('.movedPanel-link');
                const onClick = () => $state.go(MAP[current].route);

                $link.text(MAP[current].text);
                $link.on('click', onClick);
                scope.$on('$destroy', () => $link.off('click', onClick));
            }
        };
    });
