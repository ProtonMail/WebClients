angular.module("proton.emailField", [])

.directive('emailField', function ($timeout, $interval, Contact) {
  var self = this;
  var directive = {
    restrict: "A",
    scope: { emailList: "=" },
    link: function ( $scope, $element, $attrs ) {
      var $$element = $($element[0]);
      var parent = $$element.parent();
      var manager = $$element.tagsManager({
        tagsContainer: parent[0],
        tagCloseIcon: "<i class=\"fa fa-times\">",
        delimiters: [32, 44],
        prefilled: _.map(($scope.emailList || "").split(","), function (str) {
          return str.trim();
        })
      });

      var positionInput = function (argument) {
        var tt = $$element.closest(".twitter-typeahead");
        tt.appendTo(tt.parent());
      };

      var setValue = function () {
        $scope.emailList = _(manager.tagsManager('tags').concat([$$element.val()]))
          .map(function (element) { return element.trim(); })
          .filter()
          .unique()
          .value()
          .join(",");

        $scope.$apply();
      }

      $timeout(positionInput, 0);

      var emails = [];
      var tabbing = false;

      $$element.on("keydown", function (e) {
        if (e.which === 9) {
          tabbing = true;
        }
      });

      manager.on("tm:pushed", function (ev, tag) {
        positionInput();
        if (!tabbing) {
          $$element.focus();
        }
        tabbing = false;
        setValue();
      });
      manager.on("tm:popped tm:spliced", setValue);

      $$element.on("blur", function () {
        var val = $$element.val();
        if (val.length > 0) {
          manager.tagsManager("pushTag", val);
        }

        $timeout(function () { $$element.val(""); }, 0);
      })

      $$element.typeahead(null, {
        source: Contact.index.ttAdapter(),
        displayKey: "ContactName"
      }).on("typeahead:selected", function (e, d) {
        $$element.val("");
        manager.tagsManager("pushTag", d.ContactEmail);
      });

      $$element.on("change", function () {
        setValue();
      });

      $$element.autosizeInput();
    }
  };

  return directive;
});
