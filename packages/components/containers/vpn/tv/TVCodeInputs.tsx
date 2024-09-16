import { useEffect, useRef, useState } from 'react';

import { Input } from '@proton/atoms';

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
        <div className="flex justify-center md:items-center flex-column md:flex-row gap-4">
            <div className="md:flex-1 ">
                <Input
                    ref={refFirstInput}
                    minLength={4}
                    maxLength={4}
                    value={first}
                    onChange={handleOnChangeFirst}
                    onKeyUp={handleKeyUpFirst}
                    placeholder="1234"
                    inputClassName="tv-code--input"
                    className="tv-code text-bold self-end m-auto text-monospace"
                    required
                    autoFocus
                />
            </div>
            <hr className="w-custom shrink-0 m-0 hidden md:block" style={{ '--w-custom': '5%' }} />
            <div className="md:flex-1">
                <Input
                    ref={refSecondInput}
                    minLength={4}
                    maxLength={4}
                    value={second}
                    onChange={handleOnChangeSecond}
                    onKeyUp={handleKeyUpSecond}
                    placeholder="ABCD"
                    inputClassName="tv-code--input"
                    className="tv-code text-bold m-auto text-monospace"
                    required
                />
            </div>
        </div>
    );
};

export default TVCodeInputs;
