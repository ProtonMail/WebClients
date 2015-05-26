
angular.module("proton.emailField", [])

.constant("EMAIL_REGEXP",
  /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
)

.directive('emailField', function ($timeout, $interval, Contact, EMAIL_REGEXP) {
  var self = this;
  var directive = {
    restrict: "A",
    require: 'ngModel',
    link: function ( $scope, $element, $attrs, $ctrl ) {
      var $$element = $($element[0]);
      var parent = $$element.parent();

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
          .map(function (element) { return element.trim(); })
          .filter(function (data) {
            return data && EMAIL_REGEXP.test(data);
          })
          .unique()
          .value()
          .join(",")
        );
        $scope.$apply();
      };

      $timeout(positionInput, 0);

      var emails = [];
      var tabbing = false;

      var manager = $$element.tagsManager({
        tagsContainer: parent[0],
        tagCloseIcon: "<i class=\"fa fa-times\">",
        delimiters: [32, 44],
        validator: function (input) {
          return EMAIL_REGEXP.test(input);
        }
      });

      receivedTag = function (event, ui) {
        var currentTags = manager.tagsManager('tags');
        var item = ui.item[0];
        var email = item.innerText.trim();
        if (currentTags.indexOf(email) > -1) {
          ui.sender.sortable('cancel');
        }
        else {
          $(item).find('i').trigger('click');
          manager.tagsManager("pushTag", email);
        }
      };

      $(parent).closest('.typeahead-container').sortable({
        items: '.tm-tag',
        connectWith: '.typeahead-container',
        receive: receivedTag,
        containment: $(parent).closest('.composer')
      });

      manager.on("tm:pushed", function (ev, tag, tagId, $el) {
        positionInput();
        if (!tabbing) {
          $$element.focus();
        }
        tabbing = false;
        setValue();

        $($el).on('mouseover', function() {
          $(this).css('cursor', 'move');
        });

        $($el).dblclick(function( ) {
          var input = $(parent).find('.tt-input');
          $(input).val(tag);
          $$element.focus();
          $(input).trigger('change');
          $(this).find('i').trigger('click');
        });

      });

      manager.on("tm:popped tm:spliced", setValue);

      $$element
        .on("keydown", function (e) {
          if (e.which === 9) {
            tabbing = true;
          }
        })
        .on("blur", function () {
          var val = $$element.val();
          if (val.length > 0) {
            manager.tagsManager("pushTag", val);
          }

          $timeout(function () { $$element.val(""); }, 0);
        })
        .on("change", setValue)
        .typeahead(null, {
          source: Contact.index.ttAdapter(),
          templates: {
              suggestion: function(Contact) {
                  return "<b>" +Contact.ContactName + "</b><br>" + Contact.ContactEmail;
                }
            }
        }).on("typeahead:selected", function (e, d) {
          manager.tagsManager("pushTag", d.ContactEmail);
        });

      $$element.autosizeInput();
    }
  };

  return directive;
});
