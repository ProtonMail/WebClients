
angular.module("proton.emailField", [])

.constant("EMAIL_REGEXP", /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/)

.directive('emailField', function ($timeout, Contact, EMAIL_REGEXP, $sanitize) {
    var self = this;
    var directive = {
        restrict: "A",
        require: 'ngModel',
        link: function ( $scope, $element, $attrs, $ctrl ) {
            // Variables
            var $$element = $($element[0]);
            var parent = $$element.parent();
            var container = $(parent).closest('.input-container');
            var list = ($(parent).hasClass('to-container')) ? "ToList" : ($(parent).hasClass('bcc-container')) ? "BCCList" : "CCList";
            var emails = [];
            var tabbing = false;
            var manager = $$element.tagsManager({
                tagsContainer: parent[0],
                tagCloseIcon: "<i class=\"fa fa-times\">",
                delimiters: [32, 44, 9, 13],
                validator: function (input) {
                    return EMAIL_REGEXP.test(input);
                }
            });

            // Functions
            var click = function(event) {
                var selection = getSelection().toString();

                if (!selection) {
                    $$element.focus();
                }
            };

            var htmlEscape = function(str) {
                var entityMap = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': '&quot;',
                    "'": '&#39;',
                    "/": '&#x2F;'
                };

                return String(str).replace(/[&<>"'\/]/g, function (s) {
                    return entityMap[s];
                });
            };

            var extractEmails = function(value) {
                var emails = [];
                var result = value.match(/([.^\S]+@[.^\S]+\.[.^\S]+)/gi);

                if(result) {
                    emails = result;
                }

                return emails;
            };

            var clean = function(email) {
                return email
                    .replace(/</g, '')
                    .replace(/>/g, '')
                    .replace(/"/g, '')
                    .replace(/'/g, '')
                    .replace(/,/g, '')
                    .trim();
            };

            var positionInput = function (argument) {
                var tt = $$element.closest(".twitter-typeahead");

                tt.appendTo(tt.parent());
            };

            var setValue = function () {
                $ctrl.$setViewValue(_(manager.tagsManager('tags').concat([$$element.val()]))
                .filter(function (data) {
                    return data && EMAIL_REGEXP.test(data.Email);
                })
                .unique()
                .map(function (element) {
                    return {
                        Name: element.Name.trim(),
                        Address: element.Email.trim()
                    };
                })
                .value());

                $scope.message.numTags[list] = manager.tagsManager('tags').length;
            };

            var blur = function () {
                var emails = extractEmails($$element.val());
                var input = $(parent).find('.tt-input');
                var undefinedResult = false;

                _.each(emails, function(email) {
                    var managerResult = manager.tagsManager("pushTag",{
                        Name: clean(email),
                        Email: clean(email)
                    });

                    if(angular.isUndefined) {
                        undefinedResult = true;
                    }
                });

                if(undefinedResult) {
                    $$element.typeahead('val', '');
                    $(input).val('');
                    $(input).trigger('keydown');
                }

                setValue();
            };

            var focus = function() {
                $timeout(function() {
                    $('.typeahead-container').scrollTop(0);
                });
            };

            var keydown = function (event) {
                if (event.which === 9) {
                    tabbing = true;
                }
            };

            var selected = function (e, d) {
                if (typeof d.Name === 'undefined' || d.Name === '') {
                    d.Name = d.Email;
                }

                manager.tagsManager("pushTag", d);
            };

            $ctrl.$render = function () {
                _(($ctrl.$viewValue || "").split(","))
                .map(function (str) { return str.trim(); })
                .each(function (email) {
                    manager.tagsManager('pushTag', email);
                });
            };

            // Listeners
            manager.on("tm:pushed", function (ev, tag, tagId, $el) {
                positionInput();

                if (!tabbing) {
                    $$element.focus();
                }

                tabbing = false;

                $($el).dblclick(function() {
                    var input = $(parent).find('.tt-input');

                    $(this).find('i').trigger('click');
                    $(input).val(tag.Email);
                    $$element.focus();
                    $(input).trigger('keydown');
                });

                setValue();
                $$element.typeahead('val', '');
            });

            manager.on("tm:popped", setValue);
            manager.on("tm:spliced", setValue);

            // $$element.on("keydown", keydown);
            $$element.on("blur", blur);
            $$element.on("focus", focus);
            $$element.on("change", setValue);
            $$element.on("typeahead:selected", selected);

            $$element.typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                source: Contact.index.ttAdapter(),
                templates: {
                    suggestion: function(Contact) {
                        return "<b>" + $sanitize(htmlEscape(Contact.Name)) + "</b><br>" + $sanitize(htmlEscape(Contact.Email));
                    }
                }
            });

            $(container).on('click', click);

            $scope.$on('$destroy', function() {
                $$element.off("keydown", keydown);
                $$element.off("blur", blur);
                $$element.off("focus", focus);
                $$element.off("change", setValue);
                $$element.off("typeahead:selected", selected);
                $(container).off('click', click);
            });

            // Initialization
            $scope.message.recipientFields[list] = parent[0];

            positionInput();

            $$element.autosizeInput();

            _.forEach($scope.message[list], function(d) {
                if (typeof d.Name === 'undefined' || d.Name === '') {
                    d.Name = d.Address;
                }
                manager.tagsManager("pushTag", {
                    Name: d.Name,
                    Email: clean(d.Address)
                });
            });
        }
    };

    return directive;
});
