import { useLayoutEffect, useState } from 'react';

const usePopoverEvent = (selectedEvent, selectedEventRef, mainRef, days, windowWidth, windowHeight) => {
    const [popoverStyleData, setPopoverStyleData] = useState([]);

    useLayoutEffect(() => {
        if (!selectedEvent || !selectedEventRef.current || !mainRef.current) {
            setPopoverStyleData([]);
            return;
        }

        const selectedEventRect = selectedEventRef.current.getBoundingClientRect();
        const mainRect = mainRef.current.getBoundingClientRect();

        setPopoverStyleData([
            {
                left: selectedEventRect.left - mainRect.left,
                top: selectedEventRect.top - mainRect.top
            },
            {
                rect: mainRect,
                eventWidth: selectedEventRect.width
            }
        ]);
    }, [days, selectedEvent, selectedEventRef.current, mainRef.current, windowWidth, windowHeight]);

    return popoverStyleData;
};

export default usePopoverEvent;
