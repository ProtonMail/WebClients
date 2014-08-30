angular.module("proton.Messages", [])
.service('messageCache', function (Message) {
  var messages = {};
  var lists = [];

  var addMessageList = function (messageList) {
    lists.push(messageList);
    _.each(messages, function (msg, id) {
      _.find(messageList, function (other, i) {
        if (id == other.MessageID) {
          messageList.splice(i, 1, msg);
          return true;
        }
      });
    });
  };

  return {
    watchScope: function (scope, listName) {
      var messageList = scope[listName];
      if (_.isArray(messageList)) {
        addMessageList(messageList);
      }

      var unsubscribe = scope.$watch(listName, function (newVal, oldVal) {
        lists = _.without(lists, oldVal);
        addMessageList(newVal);
      });
      scope.$on("$destroy", unsubscribe);
    },
    get: function (id) {
      var msg = messages[id];
      if (msg) {
        return msg;
      } else {
        return this.put(id, Message.get({MessageID: id}));
      }
    },
    put: function (id, message) {
      message.$promise.then(function() {
        _.each(lists, function (list) {
          _.find(list, function (msg, i) {
            if (msg.MessageID == id) {
              list.splice(i, 1, message);
              return true;
            }
          });
        });
      });
      
      messages[id] = message;
      return message;
    }
  };
});
