angular.module("proton.move", [])

.directive('dropdownMove', function(
    authentication,
    cache,
    tools,
    gettext,
    CONSTANTS
) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/move.tpl.html',
        replace: true,
        scope: { conversation: '=' },
        link: function(scope, element, attrs) {
            scope.filter = '';
            scope.locs = [];
            scope.labels = [];

            // Add classic locations
            scope.locs.push({ID: '0', name: gettext('INBOX')});
            scope.locs.push({ID: '6', name: gettext('ARCHIVE')});
            scope.locs.push({ID: '4', name: gettext('SPAM')});
            scope.locs.push({ID: '3', name: gettext('TRASH')});

            // Add labels
            _.each(authentication.user.Labels, function(label) {
                scope.labels.push({ID: label.ID, name: label.Name});
            });

            /**
             * Return style object to colorize tag icon
             * @param label
             * @return {Object} style
             */
            scope.style = function(label) {
                return {
                    color: label.Color
                };
            };

            /**
             * Back to conversation / message list
             */
            scope.back = function() {
                var mailbox = tools.currentMailbox();

                $state.go("secured." + mailbox, {
                    id: null // remove ID
                });
            };

            /**
             * Move conversation to a specific location
             * @param {Object} loc
             */
            scope.move = function(loc) {
                var events = [];
                var current = tools.currentLocation();
                var messages = cache.queryMessagesCached(scope.conversation.ID);

                // Generate message event
                _.each(messages, function(message) {
                    message.LabelIDsRemoved = [current];
                    message.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[loc.ID]];
                    events.push({Action: 3, ID: message.ID, Message: {
                        ID: message.ID,
                        Selected: false,
                        LabelIDsAdded: [loc.ID],
                        LabelIDsRemoved: [current]
                    }});
                });

                // Generate conversation event
                events.push({Action: 3, ID: copy.ID, Conversation: {
                    ID: conversation.ID,
                    Selected: false,
                    LabelIDsAdded: [loc.ID],
                    LabelIDsRemoved: [current]
                }});

                // Send to cache manager
                cache.events(events);

                // Send request
                Conversation[location]([copy.ID]);

                // Back to conversation list
                scope.back();
            };

            /**
             * Apply label and archive
             * @param {Object} label
             */
            scope.applyAndArchive = function(label) {
                console.log(label.ID);
            };
        }
    };
});
