import conversation from './directives/conversation';
import conversationPlaceholder from './directives/conversationPlaceholder';
import conversationView from './directives/conversationView';
import listColumns from './directives/listColumns';
import listMobile from './directives/listMobile';
import listRows from './directives/listRows';
import stickyMessages from './directives/stickyMessages';
import actionConversation from './factories/actionConversation';
import conversationApi from './factories/conversationApi';
import conversationListeners from './factories/conversationListeners';
import mailboxIdentifersTemplate from './factories/mailboxIdentifersTemplate';
import conversationsInterceptor from './interceptors/conversationsInterceptor';
import cache from './services/cache';
import cacheCounters from './services/cacheCounters';
import markedScroll from './services/markedScroll';
import messageScroll from './services/messageScroll';

export default angular
    .module('proton.conversation', ['proton.message'])
    .config(($httpProvider) => {
        // Http Intercpetor to check auth failures for xhr requests
        $httpProvider.interceptors.push('conversationsInterceptor');
    })
    .directive('conversation', conversation)
    .directive('conversationPlaceholder', conversationPlaceholder)
    .directive('conversationView', conversationView)
    .directive('listColumns', listColumns)
    .directive('listMobile', listMobile)
    .directive('listRows', listRows)
    .directive('stickyMessages', stickyMessages)
    .factory('cache', cache)
    .factory('cacheCounters', cacheCounters)
    .factory('actionConversation', actionConversation)
    .factory('conversationApi', conversationApi)
    .factory('conversationListeners', conversationListeners)
    .factory('mailboxIdentifersTemplate', mailboxIdentifersTemplate)
    .factory('conversationsInterceptor', conversationsInterceptor)
    .factory('markedScroll', markedScroll)
    .factory('messageScroll', messageScroll).name;
