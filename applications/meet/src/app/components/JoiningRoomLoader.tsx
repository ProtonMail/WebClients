import { useEffect, useRef } from 'react';
import { useState } from 'react';

import { CircleLoader } from '@proton/atoms';

const titles = ['Generating your unique encryption keys', 'Sealing the room with end-to-end security'];

export const JoiningRoomLoader = () => {
    const [title, setTitle] = useState(titles[0]);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        timeoutRef.current = setTimeout(() => {
            setTitle(titles[1]);
        }, 2000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-start h-custom w-custom"
            style={{ '--w-custom': '22.625rem', '--h-custom': '24rem' }}
        >
            <h1 className="h2 mb-4">Getting ready...</h1>
            <div className="color-weak mb-8 text-center">{title}</div>
            <CircleLoader
                className="color-primary w-custom h-custom"
                style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
            />
        </div>
    );
};
