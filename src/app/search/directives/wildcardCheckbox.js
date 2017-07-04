angular.module('proton.search')
.directive('wildcardCheckbox', ($rootScope, authentication, gettextCatalog) => {
    const I18N = {
        info: gettextCatalog.getString('Automatically add wildcards to simple searches.', null, 'Label'),
        learn: gettextCatalog.getString('Learn more', null, 'Link')
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: `
        <label class="wildcardCheckbox-container">
            <custom-checkbox data-custom-ng-model="wildcard" data-custom-ng-click="onClick()"></custom-checkbox>
            <span class="wildcardCheckbox-info"></span>
            <a href="https://protonmail.com/support/knowledge-base/search/" target="_blank" class="wildcardCheckbox-link pm_button link"></a>
        </label>
        `,
        link(scope, element) {
            const $info = element.find('.wildcardCheckbox-info');
            const $link = element.find('.wildcardCheckbox-link');

            $info.text(I18N.info);
            $link.text(I18N.learn);
            scope.wildcard = Boolean(authentication.user.AutoWildcardSearch);
            scope.onClick = () => $rootScope.$emit('settings', { type: 'autowildcard.update', data: { AutoWildcardSearch: (scope.wildcard ? 1 : 0) } });
        }
    };
});
