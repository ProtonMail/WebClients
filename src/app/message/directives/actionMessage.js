angular.module('proton.message')
  .directive('actionMessage', ($rootScope, messageBuilder) => ({
    scope: {
      model: '=actionMessage'
    },
    link(scope, el, { actionMessageType }) {

      function onClick(e) {
        e.preventDefault();


        if (/addFile|addEmbedded/.test(actionMessageType)) {
          var dropzone = $(el).parents('.composer').find('.dropzone');
          return $rootScope.$emit("addFile", {dropzone:dropzone, isEmbedded: (actionMessageType === 'addEmbedded')});
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
