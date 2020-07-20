import { useState } from 'react';

const toModel = ({ Self, addresses = [] }) => {
    const [{ DisplayName } = {}] = addresses;
    return {
        name: Self ? DisplayName || '' : '', // DisplayName can be null
        address: '',
        domain: '',
    };
};

const useAddressModal = (member) => {
    const initialModel = toModel(member);
    const [model, updateModel] = useState(initialModel);
    const update = (key, value) => updateModel({ ...model, [key]: value });

    return {
        model,
        update,
    };
};

export default useAddressModal;
