angular.module('proton.autocomplete', [])
.filter('highlight', function() {
    return function(string, value) {
        var regex = new RegExp('(' + value + ')', 'gi');

        return string.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(regex, '<strong>$1</strong>');
    };
})
.directive('autocomplete', function ($timeout, $rootScope, regexEmail, authentication) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/autocomplete.tpl.html',
        replace: true,
        scope: {
            emails: '='
        },
        link: function (scope, element, attrs) {
            // Constants
            var TAB_KEY = 9;
            var ENTER_KEY = 13;
            var BACKSPACE_KEY = 8;
            var UP_KEY = 38;
            var DOWN_KEY = 40;
            var ESC_KEY = 27;
            var SPACE_KEY = 32;
            var timeoutChange;
            var timeoutBlur;

            // Variables
            scope.params = {
                contactsFiltered: [],
                newValue: '',
                selected: null
            };

            // Helpers
            var buildLabel = function(label, value) {
                var result;

                if(label.length > 0) {
                    result = label;
                } else {
                    result = value;
                }

                return result;
            };

            var buildValue = function(label, value) {
                var result;

                if(label.length > 0) {
                    result = label + ' <' + value + '>';
                } else {
                    result = value;
                }

                return result;
            };

            /**
            * Clean new value submited
            */
            var clean = function(value) {
                return value
                .replace(/</g, '')
                .replace(/>/g, '')
                .replace(/"/g, '')
                .replace(/,/g, '')
                .trim();
            };

            var matchEmail = function(value) {
                var emails = [];
                var result = value.match(regexEmail);

                if(result) {
                    emails = result;
                }

                return emails;
            };

            var scrollToSelected = function() {
                var ul = angular.element(element).find('.autocomplete-email');
                var li = angular.element(element).find('.selected');

                ul.scrollTop(li.offset().top - li.parent().offset().top);
            };

            var getEmails = function(value) {
                var emails = [];
                var separators = [',', ';'];
                var split = value.split(new RegExp(separators.join('|'), 'g'));

                for (var i = 0; i < split.length; i++) {
                    var block = split[i];
                    var match = block.match(regexEmail);

                    if (match !== null) {
                        var email = clean(match[0]);
                        var label = clean(block.split(email)[0]);
                        var contact = {
                            Address: email,
                            Name: buildLabel(label, email)
                        };

                        emails.push(contact);
                    }
                }

                return emails;
            };

            // Functions
            /**
            * Function called at the initialization of this directive
            */
            scope.initialization = function() {
                scope.emails = scope.emails || [];
                scope.params.newValue = '';
                scope.onChange();
            };
            /**
            * Submit a new address
            * @param {Boolean} enter
            */
            scope.onSubmit = function(enter) {
                if (enter === true && scope.params.selected !== null) {
                    scope.onAddEmail(scope.params.contactsFiltered[scope.params.selected]);
                } else if (scope.params.newValue.length > 0) {
                    var emails = getEmails(scope.params.newValue);

                    if (emails.length > 0) {
                        scope.emails = _.union(scope.emails, emails);
                    } else {
                        scope.emails.push({
                            Address: scope.params.newValue,
                            Name: scope.params.newValue
                        });
                    }

                    scope.params.newValue = '';
                    scope.onChange();
                }
            };

            scope.onFocus = function() {
                $rootScope.$broadcast('autocompleteFocussed', element);
            };

            scope.onBlur = function() {
                $rootScope.$broadcast('autocompleteBlured', element);
                $timeout.cancel(timeoutBlur);
                timeoutBlur = $timeout(function() {
                    scope.onSubmit(false);
                }, 250);
            };

            scope.onRemove = function(index) {
                scope.emails.splice(index, 1);
                scope.params.newValue = '';
                angular.element(element).find('.new-value-email').focus();
                scope.onChange();
            };

            scope.onAddEmail = function(email) {
                var index = scope.emails.indexOf(email);

                if (index === -1) {
                    scope.params.selected = null;
                    scope.params.newValue = '';
                    scope.emails.push(email);
                    angular.element(element).find('.new-value-email').focus();
                    scope.onChange();
                }
            };

            scope.onClose = function() {
                scope.params.selected = null;
            };

            scope.onOpen = function() {
                scope.params.selected = 0;
            };

            scope.onChange = function() {
                if (scope.params.newValue.length > 0) {
                    var value = scope.params.newValue.toLowerCase();
                    var list = [];
                    var contacts = _.map(authentication.user.Contacts, function(contact) {
                        return { Name: contact.Name, Address: contact.Email };
                    });

                    _.each(contacts, function(contact) {
                        // We limit the number of contact by 10
                        if (list.length <= 10) {
                            if (contact.Name.toLowerCase().indexOf(value) !== -1) {
                                list.push(contact);
                            } else if (contact.Address.toLowerCase().startsWith(value)) {
                                list.push(contact);
                            }
                        }
                    });

                    scope.params.contactsFiltered = list;
                } else {
                    scope.params.contactsFiltered = [];
                }

                if (scope.params.contactsFiltered.length > 0) {
                    scope.onOpen();
                } else {
                    scope.onClose();
                }
            };

            scope.onKeyDown = function(event, email) {
                switch (event.keyCode) {
                    case BACKSPACE_KEY:
                        var value = scope.params.newValue;
                        var emails = scope.emails;

                        if(value.length === 0 && emails.length > 0) {
                            this.onRemove(emails.length - 1);
                        }
                        break;
                    case DOWN_KEY:
                    case UP_KEY:
                    case TAB_KEY:
                    case ENTER_KEY:
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    default:
                        break;
                }
            };

            scope.onKeyUp = function(event, email) {
                switch (event.keyCode) {
                    case ENTER_KEY:
                        scope.onSubmit(true);
                        break;
                    case TAB_KEY:
                        if(scope.params.newValue.length > 0) {
                            scope.onSubmit(true);
                        } else {
                            // Focus next input (autocomplete or subject)
                            angular.element(element).parent().nextAll('.row:visible:first').find('input').focus();
                        }
                        break;
                    case DOWN_KEY:
                        if(scope.params.contactsFiltered.length > 0) {
                            if(scope.params.selected === null) {
                                scope.params.selected = 0;
                            } else if(scope.params.contactsFiltered.length > 0 && scope.params.selected < scope.params.contactsFiltered.length - 1) {
                                scope.params.selected++;
                            }
                            scrollToSelected();
                        }
                        break;
                    case UP_KEY:
                        if(scope.params.contactsFiltered.length > 0) {
                            if(scope.params.selected > 1) {
                                scope.params.selected--;
                            } else {
                                scope.params.selected = 0;
                            }
                            scrollToSelected();
                        }
                        break;
                    default:
                        break;
                }
            };
            // Initialization
            scope.initialization();
        }
    };
});
