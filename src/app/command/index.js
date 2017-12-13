import autocompleteCommand from './directives/autocompleteCommand';
import commandPalette from './directives/commandPalette';
import autocompleteCommandModel from './factories/autocompleteCommandModel';

export default angular
    .module('proton.command', [])
    .directive('autocompleteCommand', autocompleteCommand)
    .directive('commandPalette', commandPalette)
    .factory('autocompleteCommandModel', autocompleteCommandModel).name;
