export const getSenders = ({ Senders = [] } = {}) => {
    return Senders.map(({ Address, Name }) => Name || Address);
};

export const getRecipients = ({ Recipients = [] }) => {
    return Recipients.map(({ Address, Name }) => Name || Address);
};
