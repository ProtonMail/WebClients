import React, { useEffect, useState, useRef } from 'react';
import { Input } from 'react-components';
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

    const handleKeyDownFirst = (event: React.KeyboardEvent<HTMLElement>) => {
        if (first.length === 4 && event.key.length === 1) {
            event.preventDefault();
            refSecondInput?.current?.focus();
            if (second.length < 4) setSecond([second, event.key].join(''));
        }
    };

    const handleKeyDownSecond = (event: React.KeyboardEvent<HTMLElement>) => {
        if (second.length === 1 && (event.key === 'Backspace' || event.key === 'Delete')) {
            refFirstInput?.current?.focus();
            setSecond('');
        }
    };

    useEffect(() => {
        setValue([first, second].join(''));
    }, [first, second]);

    return (
        <>
            <div className="code-input-container flex flex-justify-center automobile">
                <div className="code-input-div flex-item-fluid flex flex-column aligncenter onmobile-pb1 onmobile-pt0-5">
                    <Input
                        ref={refFirstInput}
                        minLength={4}
                        maxLength={4}
                        value={first}
                        onChange={({ target }) => setFirst(target.value.toUpperCase())}
                        onKeyDown={handleKeyDownFirst}
                        placeholder="1234"
                        className="aligncenter bold mw15e flex-self-end mauto"
                        required
                    />
                </div>
                <hr className="w5 tv-hr ml1 mr1 mt1-5 mbauto nomobile" />
                <div className="code-input-div flex-item-fluid flex flex-column aligncenter onmobile-pb1 onmobile-pt0-5">
                    <Input
                        ref={refSecondInput}
                        minLength={4}
                        maxLength={4}
                        value={second}
                        onChange={({ target }) => setSecond(target.value.toUpperCase())}
                        onKeyDown={handleKeyDownSecond}
                        placeholder="ABCD"
                        className="aligncenter bold mw15e mauto"
                        required
                    />
                </div>
            </div>
        </>
    );
};

export default TVCodeInputs;
