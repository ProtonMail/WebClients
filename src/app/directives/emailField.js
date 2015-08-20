
angular.module("proton.emailField", [])

.constant("EMAIL_REGEXP", /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/)

.directive('emailField', function ($timeout, Contact, EMAIL_REGEXP, $sanitize) {
    var self = this;
    var directive = {
        restrict: "A",
        require: 'ngModel',
        link: function ( $scope, $element, $attrs, $ctrl ) {
            var $$element = $($element[0]);
            var parent = $$element.parent();
            var container = $(parent).closest('.input-container');
            var list = ($(parent).hasClass('to-container')) ? "ToList" : ($(parent).hasClass('bcc-container')) ? "BCCList" : "CCList";
            $scope.message.recipientFields[list] = parent[0];

            var click = function(event) {
                var selection = getSelection().toString();

                if (!selection) {
                    $$element.focus();
                }
            };

            $(container).on('click', click);

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

            var cleanEmail = function(email) {
                var extract = EMAIL_REGEXP.exec(email);

                if(extract === null) {
                    return email;
                } else {
                    return extract[0];
                }
            };

            $ctrl.$render = function () {
                _(($ctrl.$viewValue || "").split(","))
                .map(function (str) { return str.trim(); })
                .each(function (email) {
                    manager.tagsManager('pushTag', email);
                });
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
                .value()
            );
            $scope.$apply();
            $scope.message.numTags[list] = manager.tagsManager('tags').length;
        };

        $timeout(positionInput, 0);

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

        //   Disable drag and drop of tags
        //
        //   receivedTag = function (event, ui) {
        //     var currentTags = manager.tagsManager('tags');
        //     var item = ui.item[0];
        //     var name = item.innerText.trim();
        //     var email = $(item).attr('value');
        //     if (currentTags.indexOf(email) > -1) {
        //       ui.sender.sortable('cancel');
        //     }
        //     else {
        //       $(item).find('i').trigger('click');
        //       manager.tagsManager("pushTag", {
        //         Name: name,
        //         Email: email
        //       });
        //     }
        //   };

        //   $(parent).closest('.input-container').sortable({
        //     items: '.tm-tag',
        //     connectWith: '.input-container',
        //     receive: receivedTag,
        //     containment: $(parent).closest('.composer')
        //   });

        manager.on("tm:pushed", function (ev, tag, tagId, $el) {

            positionInput();
            if (!tabbing) {
                $$element.focus();
            }
            tabbing = false;

            // $($el).on('mouseover', function() {
            //   $(this).css('cursor', 'move');
            // });

            $($el).dblclick(function( ) {
                var input = $(parent).find('.tt-input');
                $(this).find('i').trigger('click');
                $(input).val(tag.Email);
                $$element.focus();
                $(input).trigger('keydown');
            });

            setValue();
        });

        manager.on("tm:popped tm:spliced", setValue);
        $$element
        .on("keydown", function (e) {
            if (e.which === 9) {
                tabbing = true;
            }
        })
        .on("blur", function () {
            var val = cleanEmail($$element.val());

            response = manager.tagsManager("pushTag",{
                Name: val,
                Email: val
            });
            if (response === undefined) {
                var input = $(parent).find('.tt-input');
                $timeout(function () {
                    $$element.val("");
                    $(input).val('');
                    $(input).trigger('keydown');
                }, 0);
            }
            setValue();
        })
        .on("focus", function() {
            $timeout(function() {
                $('.typeahead-container').scrollTop(0);
            });
        })
        .on("change", setValue)
        .typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            source: Contact.index.ttAdapter(),
            templates: {
                suggestion: function(Contact) {
                    return "<b>" +$sanitize(htmlEscape(Contact.Name)) + "</b><br>" + $sanitize(htmlEscape(Contact.Email));
                }
            }
        }).on("typeahead:selected", function (e, d) {
            if (typeof d.Name === 'undefined' || d.Name === '') {
                d.Name = d.Email;
            }
            manager.tagsManager("pushTag", d);
        });

        $$element.autosizeInput();

        _.forEach($scope.message[list], function(d) {
            if (typeof d.Name === 'undefined' || d.Name === '') {
                d.Name = d.Address;
            }
            manager.tagsManager("pushTag", {
                Name: d.Name,
                Email: d.Address
            });
        });
    }
};

return directive;
});
