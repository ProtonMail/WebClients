export const getSender = ({ Sender = {} } = {}) => {
    const { Name = '', Address = '' } = Sender;
    return Name || Address;
};

export const getRecipients = ({ ToList = [], BCCList = [], CCList = [] } = {}) => {
    return [...ToList, ...BCCList, ...CCList].map(({ Address, Name }) => Name || Address);
};
