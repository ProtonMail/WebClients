/**
 * Get sender from message
 * @param {Object} message.Sender
 * @return {String} Name || Address
 */
export const getSender = ({ Sender = {} } = {}) => {
    const { Name = '', Address = '' } = Sender;
    return Name || Address;
};

/**
 * Get recipients list from message
 * @param {Array} message.TolList
 * @param {Array} message.BCCList
 * @param {Array} message.CCList
 * @return {Array} [Name || Address]
 */
export const getRecipients = ({ ToList = [], CCList = [], BCCList = [] } = {}) => {
    return [...ToList, ...CCList, ...BCCList].map(({ Address, Name }) => Name || Address);
};

/**
 * Get date from message
 * @param {Integer} message.Time
 * @return {Date}
 */
export const getDate = ({ Time = 0 } = {}) => new Date(Time * 1000);
