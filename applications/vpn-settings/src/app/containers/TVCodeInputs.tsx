import { useEffect, useRef, useState } from 'react';
import * as React from 'react';

import { Input } from '@proton/components';

import './TVCodeInputs.scss';

interface Props {
    value: string;
    setValue: (value: string) => void;
}

const TVCodeInputs = ({ value, setValue }: Props) => {
    const [first, setFirst] = useState(() => value.substring(0, 4));
    const [second, setSecond] = useState(() => value.substring(4, 4));
    const refFirstInput = useRef<HTMLInputElement>(null);
    const refSecondInput = useRef<HTMLInputElement>(null);

    const handleKeyUpFirst = (event: React.KeyboardEvent<HTMLElement>) => {
        const eventKey = event.key;
        if (first.length === 4 && eventKey !== 'Backspace' && eventKey !== 'Delete') {
            event.preventDefault();
            refSecondInput?.current?.focus();
        }
    };

    const handleKeyUpSecond = (event: React.KeyboardEvent<HTMLElement>) => {
        const eventKey = event.key;
        if (second.length === 0 && (eventKey === 'Backspace' || eventKey === 'Delete')) {
            refFirstInput?.current?.focus();
            setSecond('');
        }
    };

    const handleOnChangeFirst = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value.length > 4) {
            event.preventDefault();
            return false;
        }
        setFirst(event.target.value.toUpperCase());
    };

    const handleOnChangeSecond = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value.length > 4) {
            event.preventDefault();
            return false;
        }
        setSecond(event.target.value.toUpperCase());
    };

    useEffect(() => {
        setValue([first, second].join(''));
    }, [first, second]);

    return (
        <>
            <div className="code-input-container block md:flex flex-justify-center">
                <div className="code-input-div flex-item-fluid flex flex-column text-center pb-4 md:pb-0 pt-2 md:pt-0">
                    <Input
                        ref={refFirstInput}
                        minLength={4}
                        maxLength={4}
                        value={first}
                        onChange={handleOnChangeFirst}
                        onKeyUp={handleKeyUpFirst}
                        placeholder="1234"
                        className="text-bold max-w-custom flex-align-self-end m-auto"
                        style={{ '--max-w-custom': '15em' }}
                        required
                        autoFocus
                    />
                </div>
                <hr className="w-custom tv-hr mx-4 mt-6 mb-auto hidden md:flex" style={{ '--w-custom': '5%' }} />
                <div className="code-input-div flex-item-fluid flex flex-column text-center pb-4 md:pb-0 pt-2 md:pt-0">
                    <Input
                        ref={refSecondInput}
                        minLength={4}
                        maxLength={4}
                        value={second}
                        onChange={handleOnChangeSecond}
                        onKeyUp={handleKeyUpSecond}
                        placeholder="ABCD"
                        className="text-bold max-w-custom m-auto"
                        style={{ '--max-w-custom': '15em' }}
                        required
                    />
                </div>
            </div>
        </>
    );
};

export default TVCodeInputs;
