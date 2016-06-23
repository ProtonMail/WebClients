/*
 * sieve.js
 * Sieve/Tree representation builder
 */

 var Sieve = (function() {

    var DEBUG = false;

    var MAILBOX_IDENTIFIERS = {
        "inbox"  : '0',
        "drafts" : '1',
        "sent"   : '2',
        "trash"  : '3',
        "spam"   : '4',
        "archive": '6',
        "search" : '7',
        "label"  : '8',
        "starred": '10'
    };

    var MATCH_KEYS = {
        "is"      : "Is",
        "contains": "Contains",
        "matches" : "Matches"
    };

    var OPERATOR_KEYS = {
        "all": "AllOf",
        "any": "AnyOf"
    };

    var LABEL_KEYS = {
        "all": "All",
        "any": "Any",
        "subject": "Subject",
        "sender": "Sender",
        "recipient": "Recipient",
        "attachments": "Attachments",
        "contains": "contains",
        "!contains": "does not contain",
        "is": "is exactly",
        "!is": "is not exactly",
        "matches": "matches",
        "!matches": "does not match",
        "starts": "begins with",
        "!starts": "does not begin with",
        "ends": "ends with",
        "!ends": "does not end with"
    };

    function escapeCharacters(text) {
        return text.replace(/([*?])/g, "\\\\$1");
    }

    function validateSimpleRepresentation(simple)
    {
        var pass = true;

        pass = pass && simple.hasOwnProperty('Operator');
        pass = pass && simple.hasOwnProperty('Conditions');
        pass = pass && simple.hasOwnProperty('Actions');

        if (!pass) {
            throw { name: 'InvalidInput', message: 'Invalid simple keys' };
        }

        pass = pass && simple.Operator   instanceof Object;
        pass = pass && simple.Conditions instanceof Array;
        pass = pass && simple.Actions    instanceof Object;

        if (!pass) {
            throw { name: 'InvalidInput', message: 'Invalid simple data types' };
        }

        pass = pass && simple.Operator.hasOwnProperty('label');
        pass = pass && simple.Operator.hasOwnProperty('value');

        if (!pass) {
            throw { name: 'InvalidInput', message: 'Invalid simple operator' };
        }

        for (var index in simple.Conditions) {
            var condition = simple.Conditions[index];

            pass = pass && condition.hasOwnProperty('Type');
            pass = pass && condition.Type.hasOwnProperty('label');
            pass = pass && condition.Type.hasOwnProperty('value');

            pass = pass && condition.hasOwnProperty('Comparator');
            pass = pass && condition.Comparator.hasOwnProperty('label');
            pass = pass && condition.Comparator.hasOwnProperty('value');

            pass = pass && condition.hasOwnProperty('Values');
        }

        if (!pass) {
            throw { name: 'InvalidInput', message: 'Invalid simple conditions' };
        }

        pass = pass && simple.Actions.hasOwnProperty('Labels');

        for (index in simple.Actions.Labels) {
            var label = simple.Actions.Labels[index];

            pass = pass && label.hasOwnProperty('Name');
        }

        pass = pass && simple.Actions.hasOwnProperty('Move');

        pass = pass && simple.Actions.hasOwnProperty('Mark');
        pass = pass && simple.Actions.Mark.hasOwnProperty('Read');
        pass = pass && simple.Actions.Mark.hasOwnProperty('Starred');


        if (!pass) {
            throw { name: 'InvalidInput', message: 'Invalid simple actions' };
        }

        return simple;
    }

    // Convert to Tree repreentation
    function toTree(simple)
    {
        simple = validateSimpleRepresentation(simple);

        var type = OPERATOR_KEYS[simple.Operator.value];
        var tests = [];
        var thens = [];

        for (var index in simple.Conditions)
        {
            condition = simple.Conditions[index];
            var comparator = condition.Comparator.value;
            var test = null;
            var negate = false;

            switch (comparator)
            {
                case "contains":
                case "is":
                case "matches":
                case "starts":
                case "ends":
                    break;

                case "!contains":
                case "!is":
                case "!matches":
                case "!starts":
                case "!ends":
                    comparator = comparator.substring(1);
                    negate = true;
                    break;

                default:
                    throw { name: 'InvalidInput', message: 'Unrecognized simple condition: ' + condition.Comparator.value};
            }

            for (var v in condition.Values)
            {
                var value = condition.Values[v];
                // Escape on Simple rep. "matches", "begins" and "ends" which maps to Tree "Matches"
                switch (comparator)
                {
                    case "starts":
                        comparator = "matches";
                        value = escapeCharacters(value);
                        condition.Values[v] = "".concat(value, "*");
                        break;

                    case "ends":
                        comparator = "matches";
                        value = escapeCharacters(value);
                        condition.Values[v] = "".concat("*", value);
                        break;
                }
            }

            var match = MATCH_KEYS[comparator];
            var values = unique(condition.Values);

            switch(condition.Type.value)
            {
                case "sender":
                    header = ["From"];
                    test = buildAddressTest(header, values, match);
                    break;

                case "recipient":
                    header = ["To", "Cc", "Bcc"];
                    test = buildAddressTest(header, values, match);
                    break;

                case "subject":
                    header = ["Subject"];
                    test = buildHeaderTest(header, values, match);
                    break;

                case "attachments":
                    header = null;
                    test = buildAttachmentTest();
                    break;
            }

            if (negate) test = buildTestNegate(test);
            tests.push(test);
        }

        // Labels:
        for (index in simple.Actions.Labels) {
            label = simple.Actions.Labels[index];
            then = buildFileintoThen(label.Name);
            thens.push(then);
        }

        // Move:
        if (simple.Actions.Move !== null) {
            var destination = invert(MAILBOX_IDENTIFIERS)[simple.Actions.Move];
            if (destination !== null) {
                then = buildFileintoThen(destination);
                thens.push(then);
            }
        }

        // Mark: (needs to only be included if flags are not false)
        if (simple.Actions.Mark.Read !== false || simple.Actions.Mark.Starred !== false) {
            then = buildSetflagThen(simple.Actions.Mark.Read, simple.Actions.Mark.Starred);
            thens.push(then);
            thens.push({
                "Type": "Keep"
            });
        }

        return buildBasicTree(type, tests, thens);
    }

    function fromTree(tree)
    {
        var simple = {
            "Operator": {},
            "Conditions": [],
            "Actions": {}
        };

        tree = validateTree(tree);

        operator = invert(OPERATOR_KEYS)[tree.If.Type];
        simple.Operator.label = LABEL_KEYS[operator];
        simple.Operator.value = operator;

        conditions = iterateCondition(tree.If.Tests);
        simple.Conditions = simple.Conditions.concat(conditions);

        actions = iterateAction(tree.Then);
        simple.Actions = actions;

        return simple;
    }

    function validateTree(tree) {
        if (tree instanceof Array) {
            var check = tree[0]; // First elements corresponds to the requirements
            if (check.Type === "require") {
                requirements = ["fileinto", "imap4flags"];
                if (check.List.indexOf(requirements) < 0) {
                    throw { name: 'InvalidInput', message: 'Invalid tree representation' };
                }
            }

            // Second element is used to build the modal
            tree = tree[1];
        }

        var pass = true;

        pass = pass && tree.hasOwnProperty('If');
        pass = pass && tree.If.hasOwnProperty('Tests');
        pass = pass && tree.hasOwnProperty('Then');
        pass = pass && tree.hasOwnProperty('Type');

        if (!pass) {
            throw { name: 'InvalidInput', message: 'Invalid tree representation' };
        }

        return tree;
    }

    function iterateCondition(array)
    {
        var conditions = [];

        for (var index in array) {
            var element = array[index];

            var negate = false;
            if (element.Type === "Not") {
                negate = true;
                element = element.Test;
            }

            var type = null;
            var params = null;

            switch (element.Type)
            {
                case "Exists":
                    if (element.Headers.indexOf("X-Attached") >= 0) {
                        type = "attachments";
                    }
                    break;

                case "Header":
                    if (element.Headers.indexOf("Subject") >= 0) {
                        type = "subject";
                    }
                    break;

                case "Address":
                    if (element.Headers.indexOf("From") >= 0) {
                        type = "sender";
                    }
                    else if (element.Headers.indexOf("To") >= 0) {
                        type = "recipient";
                    }
                    else if (element.Headers.indexOf("Cc")  >= 0) {
                        type = "recipient";
                    }
                    else if (element.Headers.indexOf("Bcc") >= 0) {
                        type = "recipient";
                    }
                    break;
            }

            if (type === "attachments") {
                comparator = buildSimpleComparator("Contains", negate);
            } else {
                comparator = buildSimpleComparator(element.Match.Type, negate);
            }

            params = {
                "Comparator": comparator,
                "Values": element.Keys
            };

            condition = buildSimpleCondition(type, comparator, params);
            conditions.push(condition);
        }

        return conditions;
    }

    function iterateAction(array)
    {
        var actions = buildSimpleActions();
        var labels = [];
        var labelindex = null;

        for (var index in array) {
            var skip = false;
            var element = array[index];

            var type = null;
            var params = null;

            switch (element.Type)
            {
                case "Reject":
                    throw { name: 'UnsupportedRepresentation', message: 'Unsupported filter representation' };

                case "Redirect":
                    throw { name: 'UnsupportedRepresentation', message: 'Unsupported filter representation' };

                case "Keep":
                    break;

                case "Discard":
                    actions.Move = MAILBOX_IDENTIFIERS.trash;
                    break;

                case "FileInto":
                    var name = element.Name;

                    switch (name) {
                        case "inbox":
                        case "drafts":
                        case "sent":
                        case "starred":
                        case "archive":
                        case "spam":
                        case "trash":
                            actions.Move = MAILBOX_IDENTIFIERS[name];
                            break;

                        default:
                            label = {
                                "Name": name
                            };
                            labels.push(label);
                            if (labelindex === null) labelindex = index; // preserve the index of the first label action
                            skip = true;
                            break;
                    }

                    break;

                case "AddFlag":
                    type = "mark";

                    var read = (element.Flags.indexOf("\\Seen") >= 0);
                    var starred = (element.Flags.indexOf("\\Flagged") >= 0);

                    actions.Mark = {
                        "Read": read,
                        "Starred": starred
                    };
                    break;

                default:
                    throw { name: 'UnsupportedRepresentation', message: 'Unsupported filter representation' };
            }

            if (skip) continue;
        }

        // Append labels action
        actions.Labels = labels;

        return actions;
    }

    // Public interface
    // ================

    // Public interface to the toTree() function
    function ToTree(modal)
    {
        tree = null;

        try {
            tree = toTree(modal);
        } catch (exception) {
            if (DEBUG) console.log(exception.message);
            tree = [];
        }

        return tree;
    }

    // Public interface to the fromTree() function
    function FromTree(tree)
    {
        modal = null;

        try {
            modal = fromTree(tree);
        } catch (exception) {
            if (DEBUG) console.log(exception.message);
            modal = {};
        }

        return modal;
    }

    // Generic helper functions
    // ========================

    function invert(object)
    {
        var inverted = {};

        for (var property in object) {
            if(object.hasOwnProperty(property)) {
                inverted[object[property]] = property;
            }
        }

        return inverted;
    }

    function unique(array)
    {
        return array.filter(function(item, pos, self) {
            return self.indexOf(item) == pos;
        });
    }

    // Tree representation helpers
    // ===========================
    // @internal Helper functions for building backend filter representation trees from the frontend modal

    function buildBasicTree(type, tests, actions) {
        require = buildSieveRequire();
        return [
            require,
            {
                "If":
                {
                    "Tests": tests,
                    "Type": type
                },
                "Then": actions,
                "Type": "If"
            }
        ];
    }

    function buildTestNegate(test) {
        return {
            "Test": test,
            "Type": "Not"
        };
    }

    function buildSieveRequire()
    {
        return {
            "List": ["fileinto", "imap4flags"],
            "Type": "Require"
        };
    }

    function buildHeaderTest(headers, keys, match) {
        return {
            "Headers": headers,
            "Keys": keys,
            "Match":
            {
                "Type": match
            },
            "Format":
            {
                "Type": "UnicodeCaseMap"
            },
            "Type": "Header"
        };
    }

    function buildAddressTest(headers, keys, match) {
        addresspart = "All"; // FIXME Matching to the whole address for now
        return {
            "Headers": headers,
            "Keys": keys,
            "Match":
            {
                "Type": match
            },
            "Format":
            {
                "Type": "UnicodeCaseMap"
            },
            "Type": "Address",
            "AddressPart":
            {
                "Type": addresspart
            }
        };
    }

    function buildAttachmentTest() {
        return {
            "Headers":["X-Attached"],
            "Type":"Exists"
        };
    }

    function buildSetflagThen(read, starred) {
        flags = [];
        if (read) {
            flags.push("\\Seen");
        }
        if (starred) {
            flags.push("\\Flagged");
        }
        return {
            "Flags": flags,
            "Type": "AddFlag"
        };
    }

    function buildFileintoThen(label) {
        return {
            "Name": label,
            "Type": "FileInto"
        };
    }

    // Simple representation helpers
    // =============================
    // @internal Helper functions for building frontend filter modal from the backend representation

    function buildSimpleComparator(comparator, negate) {
        comparator = invert(MATCH_KEYS)[comparator];

        if (comparator === null || comparator === undefined) {
            throw { name: 'InvalidInput', message: 'Invalid match keys' };
        }

        if (negate) comparator = "!" + comparator;

        return buildLabelValueObject(comparator);
    }

    function buildLabelValueObject(value) {
        return {
            "label": LABEL_KEYS[value],
            "value": value
        };
    }

    function buildSimpleCondition(type, comparator, params)
    {
        var condition = {
            "Type": buildLabelValueObject(type),
            "Comparator": buildLabelValueObject(comparator)
        };
        return angular.merge(condition, params);
    }

    function buildSimpleActions()
    {
        return {
            "Labels": [],
            "Move": null,
            "Mark": {
                "Read": false,
                "Starred": false
            }
        };
    }

    var expose = {
        fromTree: FromTree,
        toTree: ToTree
    };

    return expose;
}());

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sieve;
}
