import _ from 'lodash';

/**
 * Helper to generate Labels from LabelIDsAdded and LabelIDsRemoved
 * @param {Array} conversation.Labels
 * @param {Integer} conversation.ContextNumUnread
 * @param {Array} toAdd contains string label ID
 * @param {Array} toRemove contains string label ID
 * @return {Array} Labels contains label Object
 */
export const getConversationLabels = (
    { Labels = [], ContextNumUnread = 0 } = {},
    { toAdd = [], toRemove = [] } = {}
) => {
    const labels = Labels.filter((label) => toRemove.indexOf(label.ID) === -1);
    const labelsToAdd = toAdd.map((ID) => ({ ID, ContextNumUnread }));

    return _.uniqBy(labels.concat(labelsToAdd), ({ ID }) => ID);
};
