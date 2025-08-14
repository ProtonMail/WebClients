// import { useLayoutEffect, useRef, useState } from 'react';

// interface Position {
//     top: number;
//     left: number;
// }

// export const usePopupPosition = (isVisible: boolean) => {
//     const ref = useRef<HTMLButtonElement | null>(null);
//     const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

//     const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);

//     useLayoutEffect(() => {
//         const calculatePosition = () => {
//             if (isVisible && ref.current) {
//                 const rect = ref.current.getBoundingClientRect();

//                 setPosition({
//                     top: rect.top + window.scrollY,
//                     left: rect.right + window.scrollX + 1.5 * remInPixels,
//                 });
//             }
//         };

//         calculatePosition();
//         window.addEventListener('resize', calculatePosition);

//         return () => {
//             window.removeEventListener('resize', calculatePosition);
//         };
//     }, [isVisible, ref.current]);

//     return { ref, position };
// };
