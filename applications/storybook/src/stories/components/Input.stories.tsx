import { useState } from 'react';
import { InputTwo } from '@proton/components';
import ccIcon from '@proton/styles/assets/img/credit-card-icons/cc-master.svg';
import { getTitle } from '../../helpers/title';

import mdx from './Input.mdx';

export default {
    component: InputTwo,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

    const shared = {
        value,
        placeholder: 'placeholder',
        onChange: handleChange,
    };

    return (
        <div>
            <div className="mb1">
                <InputTwo error="invalid input" {...shared} />
            </div>

            <div className="mb1 mt1">
                <InputTwo {...shared} />
            </div>

            <div className="mb1 mt1">
                <InputTwo {...shared} />
            </div>

            <div className="mb1 mt1">
                <InputTwo
                    suffix={<img src={ccIcon} width="16" className="mauto" alt="Reveal password" />}
                    {...shared}
                />
            </div>

            <div className="mt1">
                <InputTwo suffix="@protonmail.com" {...shared} />
            </div>
        </div>
    );
};
