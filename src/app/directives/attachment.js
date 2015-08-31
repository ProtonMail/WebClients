angular.module("proton.attachmentHeight", [])
.directive("attachmentHeight", ['$timeout', function($timeout) {


	function link(scope, element, attrs) {

        var count = parseInt(attrs.attachmentcount)+1;
        var buttonHeight = 32;
        var maxHeight = (32*4);

        if (count>6) {
        	element.css('minHeight', maxHeight);
        }
        else {
        	if (count%2) {
        		count -= 1;
        		if (count<2) {
        			count = 2;
        		}
        	}
        	element.css('minHeight', (count*buttonHeight)+1 );
        }
	}

	return {
		link: link
	};

}]);
