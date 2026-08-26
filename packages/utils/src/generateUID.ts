let current = 0;

const generateUID = (prefix?: string) => `${prefix || 'id'}-${current++}`;

export default generateUID;
