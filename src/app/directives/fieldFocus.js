angular.module("proton.fieldFocus", [])
.directive("fieldFocus", function () {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      if (element[0].tagName==='DIV') {
        element.bind('click', function() {
          $(this).find('input').focus();
        });
      }
      element.bind('focus', function() {
	      $(element).parentsUntil('.form-field').addClass('focus');
      });
      element.bind('blur', function() {
	      $(element).parentsUntil('.form-field').removeClass('focus');
      });
    }
  };
});