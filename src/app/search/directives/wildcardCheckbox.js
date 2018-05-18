/* @ngInject */
function wildcardCheckbox($rootScope, gettextCatalog, mailSettingsModel) {
    const I18N = {
        info: gettextCatalog.getString('Do not require exact match', null, 'Label'),
        learn: gettextCatalog.getString('Learn more', null, 'Link')
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: `
        <label class="wildcardCheckbox-container">
            <custom-checkbox data-custom-ng-model="wildcard" data-custom-ng-change="onClick()"></custom-checkbox>
            <span class="wildcardCheckbox-info">${I18N.info}</span>
            <a href="https://protonmail.com/support/knowledge-base/search/" target="_blank" class="wildcardCheckbox-link pm_button link">${
                I18N.learn
            }</a>
        </label>
        `,
        link(scope) {
            const { AutoWildcardSearch } = mailSettingsModel.get();
            scope.wildcard = Boolean(AutoWildcardSearch);
            scope.onClick = () =>
                $rootScope.$emit('settings', {
                    type: 'autowildcard.update',
                    data: { AutoWildcardSearch: scope.wildcard ? 1 : 0 }
                });
        }
    };
}
export default wildcardCheckbox;
