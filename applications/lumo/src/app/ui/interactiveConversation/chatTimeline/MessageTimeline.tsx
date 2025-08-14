// import { memo } from 'react';

// import clsx from 'clsx';
// import { c } from 'ttag';

// import { Button } from '@proton/atoms';
// import { Icon } from '@proton/components';

// import type { Message } from '../../../types';

// interface Props {
//     messages: Message[];
//     activeMessageId?: string;
//     isPinned?: boolean;
//     onButtonClick: () => void;
// }

// const MessageTimeline = ({ messages, activeMessageId, isPinned = false, onButtonClick }: Props) => {
//     return (
//         <div
//             className={clsx(
//                 'flex flex-column flex-nowrap p-4 w-full',
//                 !isPinned && 'timeline-unpinned absolute top-0 right-0 border w-full border-weak rounded-2xl shadow p-4'
//             )}
//         >
//             <div className="flex flex-row flex-nowrap justify-space-between items-center mb-2">
//                 <span className="font-bold">{c('collider_2025:Title').t`Chat Timeline`}</span>
//                 <Button
//                     icon
//                     size="small"
//                     shape="ghost"
//                     onClick={onButtonClick}
//                     className="shrink-0"
//                     aria-pressed={isPinned}
//                 >
//                     <Icon
//                         name={isPinned ? 'pin-angled-filled' : 'pin-angled'}
//                         alt={c('collider_2025:Title').t`Pin timeline`}
//                     />
//                 </Button>
//             </div>
//             <ul className={clsx('max-h-full h-full overflow-y-auto')}>
//                 {messages.map((message) => {
//                     const isActive = message.id === activeMessageId;
//                     return (
//                         <li
//                             className={clsx('list-item transition-all rounded-lg mb-2 cursor-pointer', {
//                                 'border-l-4 border-primary': isActive,
//                             })}
//                             key={message.id}
//                         >
//                             <Button
//                                 shape="ghost"
//                                 className={clsx('w-full text-left p-1 pl-2 m-0', isActive && 'is-active')}
//                                 onClick={(e) => {
//                                     e.preventDefault();
//                                     document.getElementById(message.id)?.scrollIntoView({
//                                         behavior: 'smooth',
//                                     });
//                                 }}
//                             >
//                                 <span className="block text-ellipsis" title={message.content}>
//                                     {message.content}
//                                 </span>
//                             </Button>
//                         </li>
//                     );
//                 })}
//             </ul>
//         </div>
//     );
// };

// export default memo(MessageTimeline);
