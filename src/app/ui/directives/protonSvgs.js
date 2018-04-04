/* @ngInject */
function protonSvgs($http) {
    return {
        replace: true,
        template: '<div style="display: none"></div>',
        link(scope, el) {
            /*
             * load our collection of svgs and hook them up into the DOM, so we can use them using `<use xlink>`
             */
            $http.get('/assets/img/proton-svgs.svg').then(({ data }) => {
                el.html(data);
            });
        }
    };
}
export default protonSvgs;
