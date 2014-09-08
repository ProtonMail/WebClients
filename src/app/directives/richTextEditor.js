angular.module("proton.richTextEditor", [])

.directive('richTextEditor', function( $log, $location ) {

  var self = this;
  var directive = {
    restrict : "A",
    replace : true,
    transclude : true,
    scope : {
      value: "=",
      showEditor: "&"
    },
    templateUrl: "templates/directives/richTextEditor.tpl.html",
    link : function( $scope, $element, $attrs ) {
      var $$element = $($element[0]);
      var textarea = $$element.find("textarea");
      var toolbar = $$element.find("div.rich-text-toolbar");

      $$element.on('click', function (event) {
        if (event.target.tagName.toUpperCase() === "DIV") {
          $scope.editor.focus();
        }
      });
      $scope.editor = new wysihtml5.Editor(textarea[0], {
        style: false,
        toolbar: toolbar[0],
        stylesheets: ["/assets/application.css"],
        parserRules:  wysihtml5ParserRules
      });
      $scope.editor.on("change", function () {
        $scope.$apply(function () {
          $scope.value = textarea.val();
        });
      });
      $scope.editor.on("load", function () {
        resizeIframeToFitContent();
      });
      $scope.$watch('value', function( newValue, oldValue ) {
        $scope.editor.innerHTML = newValue;
        $scope.editor.composer.setValue( newValue );
      });
      function resizeIframeToFitContent() {
        alert($("iframe").height($("iframe").contents().find("html").height())); 
      }      
    }
  }
  return directive;
});
