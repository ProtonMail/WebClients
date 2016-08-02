angular.module('proton.message')
  .directive('actionMessage', ($rootScope, messageBuilder) => ({
    scope: {
      model: '=actionMessage'
    },
    link(scope, el, { actionMessageType }) {

      function onClick(e) {
        e.preventDefault();

        if ('addfile' === actionMessageType) {
          return $('#uid' + scope.model.uid).find('.dropzone').click();
        }

        const msg = messageBuilder.create(actionMessageType, scope.model);
        $rootScope.$emit('loadMessage', msg, (actionMessageType === 'forward' || msg.Attachments.length > 0));
      }

      el.on('click', onClick);

      scope
        .$on('$destroy', () => {
          el.off('click', onClick);
        });
    }
  }));
