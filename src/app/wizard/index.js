import displayWizardButton from './directives/displayWizardButton';
import wizard from './directives/wizard';
import wizardBuilder from './factories/wizardBuilder';

export default angular
    .module('proton.wizard', [])
    .directive('displayWizardButton', displayWizardButton)
    .directive('wizard', wizard)
    .factory('wizardBuilder', wizardBuilder).name;
