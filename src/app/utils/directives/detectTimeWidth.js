/* @ngInject */
function detectTimeWidth($filter) {
    /**
     * Detect the max width for the date based on your locale.
     * @param  {Integer} id Timeout ID
     * @return {void}
     */
    function computeWidth(id) {
        document.body.insertAdjacentHTML(
            'beforeEnd',
            '<div id="timeWidthTest" style="position:absolute;left:0;top:0;z-index:1;visibility:hidden">'
        );
        const $div = document.getElementById('timeWidthTest');

        // Dec 28, 2888 - longest possible width
        $div.textContent = $filter('readableTime')('29000668525');

        const width = Math.ceil($div.offsetWidth);

        if (width > 0) {
            const style = `<style>
              .conversation .time { width: ${width + 5}px; }
              .conversation .row .meta { width: ${width + 55}px;}
              </style>`;

            document.body.insertAdjacentHTML('beforeEnd', style);
        }

        document.body.removeChild($div);
        clearTimeout(id);
    }

    return {
        link() {
            const id = setTimeout(() => {
                computeWidth(id);
            }, 2400);
        }
    };
}
export default detectTimeWidth;
