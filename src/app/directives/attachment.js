angular.module("proton.attachmentHeight", [])
.directive("attachmentHeight", function() {

	function link(scope, element, attrs) {
        var count = parseInt(attrs.attachmentcount);
        var buttonHeight = 32;
        var maxHeight = (buttonHeight * 4);

        if (count > 6) {
        	element.css('maxHeight', maxHeight);
        } else {
			element.css('minHeight', ((parseInt(count / 2) + count % 2) * buttonHeight) + 1);
        }
	}

	return {
		link: link
	};
});
