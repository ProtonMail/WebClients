// import { useEffect, useRef } from 'react';

// import { useActiveMessageID } from '../../../providers/ActiveMessageProvider';
// import { Role } from '../../../types';
// import type { Message } from '../../../types';

// const useTrackActiveMessage = (
//     messageChainRef: React.MutableRefObject<HTMLDivElement | null>,
//     messageChain: Message[]
// ) => {
//     const { updateActiveMessageID } = useActiveMessageID();
//     const visibleUserMessages = useRef(new Map());

//     useEffect(() => {
//         if (!messageChainRef.current) {
//             return;
//         }

//         const isScrollble = messageChainRef.current.scrollHeight > messageChainRef.current.clientHeight;
//         if (!isScrollble) {
//             return;
//         }

//         // reset reference to new map to prevent tracking messages from other message chains
//         visibleUserMessages.current = new Map();

//         const observerCallback = (entries: IntersectionObserverEntry[]) => {
//             entries.forEach((entry) => {
//                 const messageID = entry.target.getAttribute('data-message-id');
//                 const isUserMessage = entry.target.getAttribute('data-message-role') === Role.User;
//                 // const targetElement = entry.target as HTMLElement; // Ensure target is HTMLElement

//                 if (messageID && isUserMessage) {
//                     if (entry.isIntersecting) {
//                         visibleUserMessages.current.set(messageID, entry);
//                         // targetElement.style.outline = '2px solid white'; // Highlight intersecting
//                     } else {
//                         visibleUserMessages.current.delete(messageID);
//                         // targetElement.style.outline = 'none'; // Highlight intersecting
//                     }
//                 }
//             });

//             const sortedVisibleMessages = Array.from(visibleUserMessages.current.values()).sort(
//                 (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
//             );

//             if (sortedVisibleMessages.length > 0) {
//                 const firstVisibleMessage = sortedVisibleMessages[0].target.getAttribute('data-message-id');
//                 updateActiveMessageID(firstVisibleMessage);
//             }
//         };

//         const observer = new IntersectionObserver(observerCallback, {
//             root: messageChainRef.current,
//             threshold: [0.1, 0.25, 0.5, 0.75, 1],
//         });

//         const messagesToObserve = Array.from(messageChainRef.current.children).filter(
//             (message) => message.getAttribute('data-message-role') === Role.User
//         );

//         messagesToObserve.forEach((message) => observer.observe(message));

//         return () => {
//             messagesToObserve.forEach((message) => observer.unobserve(message));
//             observer.disconnect();
//         };
//     }, [messageChainRef, messageChain]);
// };

// export default useTrackActiveMessage;
