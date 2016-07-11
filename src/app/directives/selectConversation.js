angular.module("proton.selectConversation", [])
  .directive('ptSelectConversation', function ($rootScope) {

    function countChecked(isChecked, number) {
      var num = number;
      if (isChecked) {
        num = number + 1;
      } else {
        num = number > 0 ? number -1 : 0;
      }

      return num;
    }

    return {
      scope: {
        model: '='
      },
      replace: true,
      templateUrl: 'templates/directives/ptSelectConversation.tpl.html',
      link: function (scope, el, attr) {

        var input = el[0].querySelector('input');
        input.setAttribute('data-index', attr.index);
        input.addEventListener('click', onClick);

        function onClick(e) {
          scope
            .$applyAsync(function () {
              var isChecked = e.target.checked;
              scope.model.Selected = isChecked;
              $rootScope.numberElementChecked = countChecked(isChecked, $rootScope.numberElementChecked);
              $rootScope.showWelcome = false;
            });
        }

        scope
          .$on('$destroy', function () {
            input.removeEventListener('click', onClick);
          });
      }
    };
  })
  .directive('ptSelectAllConversations', function ($rootScope) {
    return {
      link: function (scope, el) {
        $rootScope.numberElementChecked = 0;
        function onChange(e) {
          var isChecked = e.target.checked;
          scope
            .$applyAsync(function () {
              _.each(scope.conversations, function (conversation) {
                conversation.Selected = isChecked;
              });

              $rootScope.numberElementChecked = isChecked ? scope.conversations.length : 0;
              $rootScope.showWelcome = !$rootScope.numberElementChecked;
            });
        }
        el.on('change', onChange);

        scope
          .$on('$destroy', function () {
            el.off('change', onChange);
          });
      }
    };
  })
  .directive('ptSelectMultipleConversations', function ($rootScope) {

    function countChecked(conversations) {
      return _.where(conversations, {Selected: true}).length;
    }

    /**
     * Select many conversations and update the scope
     * @param  {$scope} scope
     * @return {function}       (previous, from, to)
     */
    function selectConversations(scope) {

      /**
       * Update the scope with selected conversations
       * @param  {Object} previous Previous conversation selected
       * @param  {Number} from     Index conversation
       * @param  {Number} to       Index conversation
       * @return {void}
       */
      return function (previous, from, to) {

        // Do not create another $diges, use the current one.
        scope
          .$applyAsync(function () {


            _.each(scope.conversations, function (conversation, i) {
              if (i >= from && i <= to) {
                conversation.Selected = previous.conversation.Selected;
              } else {
                return false; // Break
              }
            });

            $rootScope.numberElementChecked = countChecked(scope.conversations);
            $rootScope.showWelcome = false;
          });
      };
    }

    return {
      link: function (scope, el) {
        var previous = null;
        var items = null;
        var conversationsToSelect = selectConversations(scope);

        function onClick(e) {

          var index = e.target.getAttribute('data-index');

          if (e.shiftKey && previous) {
            var from = Math.min(index, previous.index);
            var to = Math.max(index, previous.index);
            conversationsToSelect(previous, from, to);
          }

          previous = {
            index: index,
            conversation: scope.conversations[index]
          };
        }

        // defer loading to prevent an empty collection as the ng-repeat is not compiled yet
        var id = setTimeout(function() {
          items = el.find('.ptSelectConversation-container');
          items.on('click', onClick);
          clearTimeout(id);
        }, 1000);

        scope
          .$on('$destroy', function () {
            items && items.off('click', onClick);
          });
      }
    };
  });
