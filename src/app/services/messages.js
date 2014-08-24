angular.module("proton.Messages", [])
.service('messageCache', function () {
  var messages;

  return {
    setList: function (list) { messages = list; },
    getList: function () { return messages || []; },
    find: function (id) {
      return _.find(this.getList(), function (msg) {
        return msg.MessageID == id;
      });
    }
  };
});
