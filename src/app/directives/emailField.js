
angular.module("proton.emailField", [])

.constant("EMAIL_REGEXP",
  /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
)

.directive('emailField', function ($timeout, $interval, Contact, EMAIL_REGEXP, $sanitize) {
  var self = this;
  var directive = {
    restrict: "A",
    require: 'ngModel',
    link: function ( $scope, $element, $attrs, $ctrl ) {
      var $$element = $($element[0]);
      var parent = $$element.parent();
      var container = $(parent).closest('.input-container');

      $(container).on('click', function() {
          $$element.focus();
      });

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
              Address: element.Email.trim(),
              PublicKey: 'derp'
            }; 
          })
          .value()
        );
        $scope.$apply();
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

      receivedTag = function (event, ui) {
        var currentTags = manager.tagsManager('tags');
        var item = ui.item[0];
        var name = item.innerText.trim();
        var email = $(item).attr('value');
        if (currentTags.indexOf(email) > -1) {
          ui.sender.sortable('cancel');
        }
        else {
          $(item).find('i').trigger('click');
          manager.tagsManager("pushTag", {
            Name: name, 
            Email: email,
            PublicKey: 'derp'
          });
        }
      };

      $(parent).closest('.input-container').sortable({
        items: '.tm-tag',
        connectWith: '.input-container',
        receive: receivedTag,
        containment: $(parent).closest('.composer')
      });

      manager.on("tm:pushing", function (ev, tag, tagId, $el) {
        console.log(ev);
        console.log(tag);
        console.log(tagId);
        console.log($el);
      });

      manager.on("tm:pushed", function (ev, tag, tagId, $el) {

        positionInput();
        if (!tabbing) {
          $$element.focus();
        }
        tabbing = false;

        $($el).on('mouseover', function() {
          $(this).css('cursor', 'move');
        });

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
          var val = $$element.val();
          response = manager.tagsManager("pushTag",{
            Name: val, 
            Email: val,
            PublicKey: 'derp'
          });

          if (response === undefined) {
              $timeout(function () { $$element.val(""); }, 0);
          }
        setValue();
        })
        .on("change", setValue)
        .typeahead(null, {
          source: Contact.index.ttAdapter(),
          templates: {
              suggestion: function(Contact) {
                  return "<b>" +$sanitize(Contact.Name) + "</b><br>" + $sanitize(Contact.Email);
                }
            }
        }).on("typeahead:selected", function (e, d) {
            if (typeof d.Name === 'undefined' || d.Name === '') {
                d.Name = d.Email;
            }
            manager.tagsManager("pushTag", d);
        });

      $$element.autosizeInput();

      var list = ($(parent).hasClass('to-container')) ? "ToList" : ($(parent).hasClass('bcc-container')) ? "BCCList" : "CCList";

      _.forEach($scope.message[list], function(d) {
          if (typeof d.Name === 'undefined' || d.Name === '') {
              d.Name = d.Address;
          }
          manager.tagsManager("pushTag", {
            Name: d.Name, 
            Email: d.Address,
            PublicKey: 'derp'
          });
      });
    }
  };




  return directive;
});
