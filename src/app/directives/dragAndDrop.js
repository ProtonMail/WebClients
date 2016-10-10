const app = angular.module('proton.drag', []);
// http://codepen.io/parkji/pen/JtDro
app.directive('draggable', () => {
    return function (scope, element) {
        // this gives us the native JS object
        const el = element[0];

        el.draggable = true;

        el.addEventListener(
            'dragstart',
            function (event) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('Text', 'MAIL'); // this.id
                this.classList.add('drag');
                return false;
            },
            false
        );

        el.addEventListener(
            'dragend',
            function () {
                this.classList.remove('drag');
                return false;
            },
            false
        );
    };
});

app.directive('droppable', () => {
    return {
        scope: {
            drop: '&',
            bin: '='
        },
        link(scope, element) {
            // again we need the native object
            const el = element[0];

            el.addEventListener(
                'dragover',
                function (e) {
                    e.dataTransfer.dropEffect = 'move';
                    // allows us to drop
                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    this.classList.add('over');

                    return false;
                },
                false
            );

            el.addEventListener(
                'dragenter',
                function () {
                    this.classList.add('over');
                    return false;
                },
                false
            );

            el.addEventListener(
                'dragleave',
                function () {
                    this.classList.remove('over');
                    return false;
                },
                false
            );

            el.addEventListener(
                'drop',
                function (e) {
                    // Stops some browsers from redirecting.
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }

                    this.classList.remove('over');

                    const binId = this.id;
                    const item = document.getElementById(e.dataTransfer.getData('Text'));
                    this.appendChild(item);
                    // call the passed drop function
                    scope.$apply((scope) => {
                        const fn = scope.drop();
                        if (fn !== 'undefined') {
                            fn(item.id, binId);
                        }
                    });

                    return false;
                },
                false
            );
        }
    };
});
