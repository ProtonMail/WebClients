const UNIQ_FIELDS = {
    n: true,
    bday: true,
    anniversary: true,
    gender: true,
    prodid: true,
    rev: true,
    uid: true
};

const isUniqField = (field = '') => UNIQ_FIELDS[field.toLowerCase()];

export default isUniqField;
