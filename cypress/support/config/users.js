const MAP = Object.create(null);

const init = (type) => {
    const name = `robert${Date.now()}`;
    !MAP[type] && (MAP[type] = name);
    return name;
};

const get = (type) => MAP[type] || 'qae';

module.exports = { init, get };
