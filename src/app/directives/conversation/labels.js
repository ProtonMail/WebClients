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
        if (Array.isArray(LabelIDs) && LabelIDs.some(id => isNaN(+id))) {
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
.directive('foldersConversation', ($rootScope, $state, CONSTANTS, gettextCatalog, $compile) => {

  const ALLOWED_STATE = ['secured.sent', 'secured.sent.view', 'secured.drafts', 'secured.drafts.view'];
  const isAllowedState = () => _.contains(ALLOWED_STATE, $state.$current.name);

  const MAP_ICONS = {
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

  const contains = (key, labels) => _.contains(labels, CONSTANTS.MAILBOX_IDENTIFIERS[key]);

  const icon = (key) => {
    const { className, tooltip } = MAP_ICONS[key];
    return `<i class="fa ${className}" pt-tooltip-translate="${tooltip}"></i>`;
  };

  const getTemplateIcons = (labels) => {
    return Object
      .keys(MAP_ICONS)
      .reduce((acc, key) => {
        if (contains(key, labels)) {
          return acc + icon(key);
        }
        return acc;
      }, '');
  };

  return {
    templateUrl: 'templates/directives/conversation/folders.tpl.html',
    replace: true,
    scope: {
      conversation: '='
    },
    link(scope, el) {

      const build = (event, { LabelIDs }) => {
        if (Array.isArray(LabelIDs) && isAllowedState()) {
            const tpl = $compile(getTemplateIcons(LabelIDs))(scope);
            el.empty().append(tpl);
          }
      };

      const unsubscribe = $rootScope.$on('foldersConversation.' + scope.conversation.ID, build);

      build(undefined, scope.conversation);

      scope.$on('$destroy', unsubscribe);
    }
  };
});
