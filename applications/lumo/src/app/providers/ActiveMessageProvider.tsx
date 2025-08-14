// import React, { createContext, useContext, useState } from 'react';
// import type { ReactNode } from 'react';

// interface ActiveMessageProviderProps {
//     activeMessageID: string | undefined;
//     updateActiveMessageID: (newID: string) => void;
//     isTimelinePinned: boolean;
//     toggleTimelineView: () => void;
// }

// export const ActiveMessageContext = createContext<ActiveMessageProviderProps | null>(null);

// interface Props {
//     children?: ReactNode;
// }

// const useActiveMessageState = () => {
//     const [activeMessageID, setActiveMessageID] = useState<string>();
//     const [isTimelinePinned, setIsTimelinePined] = useState<boolean>(false);

//     const updateActiveMessageID = (newID: string) => {
//         // console.log('Updating active message ID: ', newID);
//         setActiveMessageID(newID);
//     };

//     const toggleTimelineView = () => {
//         return setIsTimelinePined(!isTimelinePinned);
//     };

//     return {
//         activeMessageID,
//         updateActiveMessageID,
//         isTimelinePinned,
//         toggleTimelineView,
//     };
// };

// export const ActiveMessageProvider = ({ children }: Props) => {
//     const value = useActiveMessageState();

//     return <ActiveMessageContext.Provider value={value}>{children}</ActiveMessageContext.Provider>;
// };

// export function useActiveMessageID() {
//     const state = useContext(ActiveMessageContext);

//     if (!state) {
//         throw new Error('Initilize Active Message ID Provider!');
//     }

//     return state;
// }
