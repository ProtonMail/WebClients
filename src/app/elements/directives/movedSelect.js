/* @ngInject */
function movedSelect(
    authentication,
    dispatchers,
    gettextCatalog,
    networkActivityTracker,
    mailSettingsModel,
    settingsMailApi,
    translator,
    notification
) {
    const I18N = translator(() => ({
        includeMoved: gettextCatalog.getString('Include Moved', null, 'Option'),
        hideMoved: gettextCatalog.getString('Hide Moved', null, 'Option'),
        success: gettextCatalog.getString('Setting updated', null, 'Success'),
        labelSelect: gettextCatalog.getString('Sent / Drafts folders appearance', null, 'Label')
    }));

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: `
            <span class="movedSelect-container pm_select inline">
                <label>
                    <span class="sr-only">${I18N.labelSelect}</span>
                    <select class="movedSelect-select">
                        <option value="3">${I18N.includeMoved}</option>
                        <option value="0">${I18N.hideMoved}</option>
                    </select>
                    <i class="fa fa-angle-down"></i>
                </label>
            </span>
            `,
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const $select = element.find('select');
            const set = (moved) => $select.val(+moved);
            const get = () => ~~$select.val();

            on('mailSettings', () => {
                set(mailSettingsModel.get('ShowMoved'));
            });

            set(mailSettingsModel.get('ShowMoved'));

            function onChange() {
                const ShowMoved = get();
                const promise = settingsMailApi.updateShowMoved({ ShowMoved }).then(() => {
                    notification.success(I18N.success);
                });

                networkActivityTracker.track(promise);
            }

            $select.on('change', onChange);

            scope.$on('$destroy', () => {
                unsubscribe();
                $select.off('change', onChange);
            });
        }
    };
}
export default movedSelect;
