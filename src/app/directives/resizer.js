angular.module('proton.resizer', []).directive('resizer', function($document) {

    return function($scope, $element, $attrs) {

        $element.on('mousedown', function(event) {
            event.preventDefault();

            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });

        function mousemove(event) {

            if ($attrs.resizer === 'vertical') {
                // Handle vertical resizer
                var x = event.pageX - 190;

                // console.log($attrs.resizerMin, $attrs.resizerMax, x);

                if ( x > $attrs.resizerMax ) {
                    console.log(x, 'max');
                    x = parseInt($attrs.resizerMax);
                }
                else if ( x < $attrs.resizerMin ) {
                    console.log(x, 'min');
                    x = parseInt($attrs.resizerMin);
                }

                $($attrs.resizerLeft).css({
                    width: x + 'px',
                    minWidth: x + 'px'
                });

            }
        }

        function mouseup() {
            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
        }
    };
});