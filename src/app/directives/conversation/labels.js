angular.module('proton.conversation', [])
.directive('labelsElement', ($rootScope, $filter, $state) => {
  const toLabels = $filter('labels');
  const HIDE_CLASSNAME = 'labelsElement-hidden';

  const moreVisibility = (node) => ({
    hide() {
      node.classList.add(HIDE_CLASSNAME);
    },
    show() {
      _rAF(() => node.classList.remove(HIDE_CLASSNAME));
    }
  });

  return {
    restrict: 'E',
    templateUrl: 'templates/directives/conversation/labels.tpl.html',
    replace: true,
    scope: {
      element: '='
    },
    link(scope, el, attrs) {

      const moreToggle = moreVisibility(el[0].querySelector('.labelsElement-more'));

      const build = (e, { LabelIDs }) => {
        moreToggle.hide();

        // Check if there is custom labels
        if (Array.isArray(LabelIDs)) {
          const labels = toLabels(LabelIDs);
          scope.labels = labels.slice(0, 4);
          labels.length > 4 && moreToggle.show();
        }
      };

      const onClick = (e) => {
        e.stopPropagation();

        const { target } = e;
        if ('LABEL' === target.nodeName) {
          const label = target.getAttribute('data-label-id');
          $state.go('secured.label', { label });
        }
      };

      const unsubscribe = $rootScope.$on('labelsElement.' + scope.element.ID, build);

      build(undefined, scope.element);

      el.on('click', onClick);

      scope
        .$on('$destroy', () => {
          el.off('click', onClick);
          unsubscribe();
        });
    }
  };
})
.directive('foldersConversation', ($rootScope, $state, CONSTANTS, gettextCatalog, $compile, mailboxIdentifersTemplate) => {

  const ALLOWED_STATE = ['secured.sent', 'secured.sent.view'];
  const isAllowedState = () => _.contains(ALLOWED_STATE, $state.$current.name);

  const MAP_LABELS = {
    archive: {
      className: 'fa-archive',
      tooltip: gettextCatalog.getString('In archive', null)
    },
    trash: {
      className: 'fa-trash-o',
      tooltip: gettextCatalog.getString('In trash', null)
    },
    spam: {
      className: 'fa-ban',
      tooltip: gettextCatalog.getString('In spam', null)
    }
  };

  const { getTemplateLabels } = mailboxIdentifersTemplate({ MAP_LABELS });


  return {
    templateUrl: 'templates/directives/conversation/folders.tpl.html',
    replace: true,
    scope: {
      conversation: '='
    },
    link(scope, el) {

      const build = (event, { LabelIDs }) => {
        if (Array.isArray(LabelIDs) && isAllowedState()) {
            const tpl = $compile(getTemplateLabels(LabelIDs))(scope);
            el.empty().append(tpl);
          }
      };

      const unsubscribe = $rootScope.$on('foldersConversation.' + scope.conversation.ID, build);

      build(undefined, scope.conversation);

      scope.$on('$destroy', unsubscribe);
    }
  };
})
.factory('mailboxIdentifersTemplate', (CONSTANTS) => {

  const contains = (key, labels) => _.contains(labels, CONSTANTS.MAILBOX_IDENTIFIERS[key]);
  const templateTag = (className, tooltip) => `<i class="${className}" translate>${tooltip}</i>`;

  /**
   * Compile a template with its className and the tooltip to display
   * @param  {String} options.className
   * @param  {String} options.tooltip
   * @param  {Function} templateMaker          Custom funciton to build a template function(className, tooltip)
   * @return {String}                   template
   */
  const icon = ({ className, tooltip }, templateMaker) => {
    if (templateMaker) {
      return templateMaker(className, tooltip);
    }
    return `<i class="fa ${className}" pt-tooltip="${tooltip}"></i>`;
  };

  /**
   * Returm a factory to expose a context
   * @param  {Object} options.MAP_LABELS map {<label> : {tootlip: <string:translated>, className: <string> }}
   * @param  {Object} options.MAP_TAGS   {<tag> : {tootlip: <string:translated>, className: <string> }}
   * @return {Object}                    {getTemplateLabels, getTemplateTags}
   */
  return ({ MAP_LABELS, MAP_TYPES }) => {

    /**
     * Take a list of labels and check if they exist inside MAILBOX_IDENTIFIERS
     * Then create a template for the icon matching this label based on MAP_LABELS
     * @param  {Array} labels
     * @return {String}       Template
     */
    const getTemplateLabels = (labels) => {
      return Object
        .keys(MAP_LABELS)
        .reduce((acc, key) => {
          if (contains(key, labels)) {
            return acc + icon(MAP_LABELS[key]);
          }
          return acc;
        }, '');
    };

    /**
     * Take the type of message and build the template matching the number
     * @param  {Number} type
     * @return {String}       Template
     */
    const getTemplateType = (type) => {
      if (2 === type || 3 === type) {
        return icon(MAP_TYPES.sent, templateTag);
      }
      if (type === 1) {
        return icon(MAP_TYPES.drafts, templateTag);
      }
      return '';
    };

    return { getTemplateLabels, getTemplateType };
  };
});
