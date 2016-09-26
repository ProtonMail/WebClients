angular.module('proton.message')
  .directive('actionMessage', ($rootScope, messageBuilder) => ({
    scope: {
      model: '=actionMessage'
    },
    link(scope, el, { actionMessageType }) {
      function onClick(e) {
        e.preventDefault();

        if (/addFile|addEmbedded/.test(actionMessageType)) {
            return $rootScope.$emit('addFile', {
                asEmbedded: (actionMessageType === 'addEmbedded'),
                message: scope.model
            });
        }

        $rootScope.$emit('composer.new', {type: actionMessageType, message: scope.model});
      }

      el.on('click', onClick);

      scope
        .$on('$destroy', () => {
          el.off('click', onClick);
        });
    }
  }));
