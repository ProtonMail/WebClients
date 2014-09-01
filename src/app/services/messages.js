angular.module("proton.Messages", [])
.service('messageCache', function ($q, Message) {
  var lists = [];

  var messagesToPreload = _.bindAll({
    fetching: false,
    queue: [],
    add: function (id) {
      if (!_.contains(this, id)) {
        this.queue.push(id);
        this.fetch();
      }
    },
    fetch: function () {
      if (!this.fetching && this.queue.length > 0) {
        this.fetching = true;
        this.fetchNext();
      }
    },
    fetchNext: function () {
      var self = this;
      api.get(this.queue.shift()).$promise.then(function () {
        if (self.queue.length === 0) {
          self.fetching = false;
        } else {
          self.fetchNext();
        }
      });
    }
  });

  var cachedMessages = _.bindAll({
    cache: {},
    get: function (id) {
      var msg;
      if ((msg = this.cache[id])) {
        return msg;
      }

      var data = window.sessionStorage["proton:message:"+id];
      if (data) {
        data = new Message(JSON.parse(data));
        var q = $q.defer();
        data.$promise = q.promise;
        q.resolve(data);
        this.cache[id] = data;
      }
      return data;
    },
    put: function (id, message) {
      var self = this;
      message.$promise.then(function () {
        _.each(lists, function (list) {
          _.find(list, function (msg, i) {
            if (msg.MessageID == id) {
              list.splice(i, 1, message);
              return true;
            }
          });
        });
        self.cache[id] = message;
        window.sessionStorage["proton:message:"+id] = JSON.stringify(message);
      });
    }
  });

  var addMessageList = function (messageList) {
    var msg;

    lists.push(messageList);
    _.find(messageList, function (other, i) {
      if ((msg = cachedMessages.get(other.MessageID))) {
        messageList.splice(i, 1, msg);
        _.extend(msg, _.pick(other, 'IsRead', 'Tag', 'Location'));
      } else if (!other.IsRead) {
        messagesToPreload.add(other.MessageID);
      }
    });
  };

  var api = _.bindAll({
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
      var msg = cachedMessages.get(id);
      if (!msg) {
        msg = Message.get({MessageID: id});
        cachedMessages.put(id, msg);
      }
      return msg;
    }
  });

  return api;
});
