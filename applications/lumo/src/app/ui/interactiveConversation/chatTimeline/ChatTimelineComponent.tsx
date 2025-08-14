// import { memo, useState } from 'react';

// import { useActiveMessageID } from '../../../providers/ActiveMessageProvider';
// import { type Message, Role } from '../../../types';
// import { BarTimeline } from './BarTimeline';
// import MessageTimeline from './MessageTimeline';

// interface Props {
//     messageChain: Message[];
//     // position?: number;
// }

// const ChatTimelineComponent = ({ messageChain }: Props) => {
//     const { activeMessageID, isTimelinePinned, toggleTimelineView } = useActiveMessageID();
//     // const [isTimelinePinned, setIsTimelinePined] = useState<boolean>(false);
//     const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

//     const messages: Message[] = messageChain.filter((d) => {
//         return d.role == Role.User;
//     });

//     // const toggleTimelineView = () => {
//     //     return setIsTimelinePined(!isTimelinePinned);
//     // };

//     const showMessageTimeline = isTimelinePinned || isDropdownVisible;

//     return (
//         <div
//             className="absolute flex flex-column w-full"
//             style={{ top: '105px', right: '10px' }}
//             onMouseEnter={() => {
//                 setIsDropdownVisible(true);
//             }}
//             onMouseLeave={() => setIsDropdownVisible(false)}
//         >
//             {showMessageTimeline ? (
//                 <MessageTimeline
//                     messages={messages}
//                     activeMessageId={activeMessageID}
//                     onButtonClick={toggleTimelineView}
//                     isPinned={isTimelinePinned}
//                 />
//             ) : (
//                 <BarTimeline messages={messages} activeMessageID={activeMessageID} />
//             )}
//         </div>
//     );
// };

// export default memo(ChatTimelineComponent);
