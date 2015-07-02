angular.module("proton.messages.counts", [])
    .service('messageCounts', function($q, Message, CONSTANTS, $rootScope, tools) {
		    var totalCounts = _.bindAll({
                move: function(messages) {
                    console.log(messages, $rootScope);
                }
            });

            var unreadCounts = _.bindAll({
                move :  function(messages) {

                    // Object to hold the changes to each count. Can be positive or negative depending if increased or decreased
                    var counterUpdates = {Locations: {}, Labels: {}};

                    // Checks each message to see if count should increase decrease or stay the same
                    _.each(messages, function(message) {
                        if (message.Location !== message.OldLocation) {
                            mID = counterUpdates.Locations[message.Location];
                            mID = (typeof mID === 'undefined') ? 0 : mID;
                            counterUpdates.Locations[message.Location] = (message.IsRead === 0) ? mID + 1 : mID;

                            curID = counterUpdates.Locations[message.OldLocation];
                            curID = (typeof curID === 'undefined') ? 0 : curID;
                            counterUpdates.Locations[message.OldLocation] = (message.IsRead === 0) ? curID - 1 : curID;
                        }
                    });

                    this.update('Locations', counterUpdates.Locations);
                },
                mark : function(messages, status) {

                    // Object to hold the changes to each count. Can be positive or negative depending if increased or decreased
                    var counterUpdates = {Locations: {}, Labels: {}};

                    // Checks each message and each label for each message to see if count should increase decrease or stay the same
                    _.each(messages, function(message) {
                        mID = counterUpdates.Locations[message.Location];
                        mID = (typeof mID === 'undefined') ? 0 : mID;
                        counterUpdates.Locations[message.Location] = (status) ? mID - 1 : mID + 1;
                        _.each(message.LabelIDs, function(labelID) {
                            lID = counterUpdates.Labels[labelID];
                            lID = (typeof lID === 'undefined') ? 0 : lID;
                            counterUpdates.Labels[labelID] = (status) ? lID - 1 : lID + 1;
                        });
                    });

                    this.update('Locations', counterUpdates.Locations);
                    this.update('Labels', counterUpdates.Labels);
                },

                // Updates counters with the update object
                update: function(location, updates) {
                    _.each(updates, function(val, id) {
                        ID = $rootScope.counters[location][id];
                        ID = (typeof ID === 'undefined') ? val : ID + val;
                        $rootScope.counters[location][id] = (ID < 0) ? 0 : ID;
                    });
                }
            });

            var api = _.bindAll({
                updateTotals: function(action, messages) {
                    totalCounts[action](messages);

                    // Delete Message

                    // Receive Message

                    // Move Messages

                    // Star Messages

                    // Change Label

                    // Receive Message

                    // Create Sent Message

                },
                updateUnread: function(action, messages, status) {
                    unreadCounts[action](messages, status);

                    // Delete Message *

                    // Receive Message

                    // Move Message *

                    // Star Message

                    // Change Label

                    // Mark Unread in Message List *

                    // Mark Unread in Message View

                    // Message View to Mailbox

                },
            });

            return api;
	});
