// import { memo } from 'react';

// import clsx from 'clsx';

// import type { Message } from '../../../types';

// interface Props {
//     messages: Message[];
//     activeMessageID?: string;
// }

// const BarTimelineComponent = ({ messages, activeMessageID }: Props) => {
//     return (
//         <div
//             className={clsx(
//                 'max-h-full h-full overflow-y-auto w-1/3 pt-2 pr-8 flex flex-column items-end gap-4 self-end'
//             )}
//         >
//             {messages.map(({ id }) => {
//                 const isActive = activeMessageID === id;
//                 return (
//                     <div
//                         className={clsx('rounded-lg h-custom', isActive ? 'w-full bg-primary' : 'w-1/2 timeline-bar')}
//                         key={id}
//                         style={{ '--h-custom': '3px' }}
//                     ></div>
//                 );
//             })}
//         </div>
//     );
// };

// export const BarTimeline = memo(BarTimelineComponent);
