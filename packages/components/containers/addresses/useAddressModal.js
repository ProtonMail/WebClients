import { useState } from 'react';
import { replaceLineBreak } from 'proton-shared/lib/helpers/string';

const toModel = ({ Self, addresses }) => {
    const [{ DisplayName, Signature }] = addresses;
    return {
        name: Self ? DisplayName || '' : '', // DisplayName can be null
        signature: Self ? replaceLineBreak(Signature || '') : '', // Signature can be null
        address: '',
        domain: ''
    };
};

const useAddressModal = (member) => {
    const initialModel = toModel(member);
    const [model, updateModel] = useState(initialModel);
    const update = (key, value) => updateModel({ ...model, [key]: value });

    return {
        model,
        update
    };
};

export default useAddressModal;