// Resize the height of the composer
function resizeComposer() {
	var margin = 20;
	var navbar = $('#navbar').outerHeight();
	var windowHeight = $(window).height() - margin - navbar;
	var composerHeight = $('.composer').outerHeight();

	if(windowHeight < composerHeight) {
		$('.composer').css({
			height: windowHeight + 'px',
			overflowY: 'auto'
		});
	} else {
		$('.composer').css({
			height: 'auto',
			overflowY: 'auto'
		});
	}
}
