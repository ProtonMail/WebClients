/* @ngInject */
function selectPlan(dispatchers, gettextCatalog, subscriptionModel) {
    const ACTIVE_BUTTON_CLASS = 'primary';
    const I18N = {
        downgradeToFree: gettextCatalog.getString('Switch to Free', null, 'Button to select plan on the dashboard'),
        downgradeToPlus: gettextCatalog.getString('Switch to Plus', null, 'Button to select plan on the dashboard'),
        downgradeToProfessional: gettextCatalog.getString(
            'Switch to Professional',
            null,
            'Button to select plan on the dashboard'
        ),
        updateFree: gettextCatalog.getString('Update Free', null, 'Button to select plan on the dashboard'),
        updatePlus: gettextCatalog.getString('Update Plus', null, 'Button to select plan on the dashboard'),
        updateProfessional: gettextCatalog.getString(
            'Update Professional',
            null,
            'Button to select plan on the dashboard'
        ),
        updateVisionary: gettextCatalog.getString('Update Visionary', null, 'Button to select plan on the dashboard'),
        upgradeToPlus: gettextCatalog.getString('Upgrade to Plus', null, 'Button to select plan on the dashboard'),
        upgradeToProfessional: gettextCatalog.getString(
            'Upgrade to Professional',
            null,
            'Button to select plan on the dashboard'
        ),
        upgradeToVisionary: gettextCatalog.getString(
            'Upgrade to Visionary',
            null,
            'Button to select plan on the dashboard'
        )
    };

    const MAP = {
        free: {
            free: I18N.updateFree,
            plus: I18N.upgradeToPlus,
            professional: I18N.upgradeToProfessional,
            visionary: I18N.upgradeToVisionary
        },
        plus: {
            free: I18N.downgradeToFree,
            plus: I18N.updatePlus,
            professional: I18N.upgradeToProfessional,
            visionary: I18N.upgradeToVisionary
        },
        professional: {
            free: I18N.downgradeToFree,
            plus: I18N.downgradeToPlus,
            professional: I18N.updateProfessional,
            visionary: I18N.upgradeToVisionary
        },
        visionary: {
            free: I18N.downgradeToFree,
            plus: I18N.downgradeToPlus,
            professional: I18N.downgradeToProfessional,
            visionary: I18N.updateVisionary
        }
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: '<button class="selectPlan-button pm_button large" type="button"></button>',
        link(scope, element, { plan }) {
            const { dispatcher, on, unsubscribe } = dispatchers(['dashboard']);
            const onClick = () => dispatcher.dashboard('select.plan', { plan });

            on('subscription', (event, { type }) => {
                type === 'update' && update();
            });

            function update() {
                const currentPlanName = subscriptionModel.name();

                element.text(MAP[currentPlanName][plan]);
                element.addClass(ACTIVE_BUTTON_CLASS);
                currentPlanName === plan && element.removeClass(ACTIVE_BUTTON_CLASS);
            }

            element.on('click', onClick);
            update();

            scope.$on('$destroy', () => {
                element.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default selectPlan;
