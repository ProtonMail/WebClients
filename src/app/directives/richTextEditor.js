angular.module("proton.richTextEditor", [])

// Common directive for Focus
.directive('focus', function($timeout) {
  return {
    scope : {
      trigger : '@focus'
    },
    link : function(scope, element) {
      scope.$watch('trigger', function(value) {
        if (value === "true") {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
    }
  };
})


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
        stylesheets: ["/assets/application.css","/assets/app.css"],
        parserRules:  wysihtml5ParserRules
      });
      $scope.editor.on("change", function () {
        resizeIframeToFitContent();
        $scope.$apply(function () {
          $scope.value = textarea.val();
        });
      });
      $scope.editor.on("load", function () {
        resizeIframeToFitContent();
        setTimeout( function() {
          resizeIframeToFitContent();
        }, 200);
        $('.wysihtml5-sandbox').contents().find('body').on("keydown",function() {
          resizeIframeToFitContent();
        });
      });
      $scope.$watch('value', function( newValue, oldValue ) {
        $scope.editor.innerHTML = newValue;
        $scope.editor.composer.setValue( newValue );
      });
      window.onresize = function() {
        resizeIframeToFitContent();
      }
      function resizeIframeToFitContent() {
        $(".wysihtml5-sandbox").css('height','auto');
        // var iframeHeight = $(".wysihtml5-sandbox").contents().find("html").outerHeight();
        // iframeHeight = iframeHeight*1.3;

        var main = $('#main').outerHeight();
        var footer = $('#footer').outerHeight();
        var navbar = $('#navbar').outerHeight();
        var toolbar = $('#main .message-toolbar').outerHeight();
        var subject = $('#message-title').outerHeight();
        var to = $('#message-to').parent().outerHeight();
        var cc = $('#message-cc').parent().outerHeight();
        var bcc = $('#message-bcc').parent().outerHeight();
        var richTextToolbar = $('.rich-text-toolbar').outerHeight();
        var iframeHeight = main - navbar - toolbar - subject - to - cc - bcc - richTextToolbar - footer - 30; // 30 -> padding

        $(".wysihtml5-sandbox").css('height', iframeHeight);
      }
    }
  }
  return directive;
});
