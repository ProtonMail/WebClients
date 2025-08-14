// import type { MutableRefObject} from 'react';
// import { useEffect, useState } from 'react';

// import type { Message } from '../types';

// export const useIsMessageChainScrollable = (
//     messageChain: Message[],
//     messageChainRef: MutableRefObject<HTMLDivElement | null>
// ) => {
//     const [isMessageChainScrollable, setIsMessageChainScrollable] = useState(false);

//     useEffect(() => {
//         const element = messageChainRef.current;
//         if (!element) return;
//         setIsMessageChainScrollable(element.scrollHeight > element.clientHeight);
//     }, [messageChain, messageChainRef]);

//     return {
//         isMessageChainScrollable,
//     };
// };
