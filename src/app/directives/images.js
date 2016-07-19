angular.module("proton.images", [])
.directive('images', function ($timeout, gettextCatalog) {
    return {
        link: function(scope, element, attributes) {
				var images;

				scope.$watch(attributes.ngBindHtml, function() {
			        images = angular.element(element).find('img');
			        if(images) {
			        	angular.element(images)
			        	.each(function() {
							var src = angular.element(this).attr("src");
							var embedded = new RegExp('^(cid:)', 'g');
							var isEmbedded = embedded.test(src);
							if(this.complete) {
								(isEmbedded) ? angular.element(this).wrap('<div class="image loading"></div>') : '';
							}
						});

			    	}

				});
        }
    };
});