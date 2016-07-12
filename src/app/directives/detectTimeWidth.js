angular.module('proton.detectTimeWidth', [])
  .directive('detectTimeWith', function ($filter) {

    /**
     * Detect the max width for the date based on your locale.
     * @param  {Integer} id Timeout ID
     * @return {void}
     */
    function computeWidth(id) {

      document.body.insertAdjacentHTML('beforeEnd', '<div id="timeWidthTest" style="position:absolute;left:0;top:0;z-index:1;visibility:hidden">');
      var $div = document.getElementById('timeWidthTest');

      // Dec 28, 2888 - longest possible width
      $div.textContent = $filter('readableTime')('29000668525');

      var width = Math.ceil($div.offsetWidth);

      if (width > 0) {
        var style = "<style>.conversation .row .meta em.time { width: "+ width +"px !important; } .conversation .row .meta { width: "+ (width+40) +"px !important;} .conversation .row h4 { width: calc(100% - "+ (width+75) +"px) !important; }</style>";

        document.body.insertAdjacentHTML('beforeEnd', style);
      }

      document.body.removeChild($div);
      clearTimeout(id);
    }

    return {
      link: function (scope, el, attr) {
        var id = setTimeout(function () {
          computeWidth(id);
        }, 2400);
      }
    };

  });