import { useState } from 'react';

const toModel = ({ ID, Self, addresses = [] }) => {
    const [{ DisplayName } = {}] = addresses;
    return {
        id: ID,
        name: Self ? DisplayName || '' : '', // DisplayName can be null
        address: '',
        domain: '',
    };
};

const useAddressModel = (member) => {
    const initialModel = toModel(member);
    const [model, updateModel] = useState(initialModel);
    const update = (key, value) => updateModel({ ...model, [key]: value });

    return {
        model,
        update,
    };
};

export default useAddressModel;
