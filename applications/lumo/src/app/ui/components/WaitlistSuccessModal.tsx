// import { c } from 'ttag';

// import { ButtonLike } from '@proton/atoms';
// import type { ModalStateProps } from '@proton/components';
// import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
// import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
// import lumoWaitlistBox from '@proton/styles/assets/img/lumo/lumo-waitlist-box.svg';
// import lumoWaitlistSuccess from '@proton/styles/assets/img/lumo/lumo-waitlist-success.svg';

// import { LumoPrompt } from './LumoPrompt/LumoPrompt';

// interface Props {
//     onClick?: () => void;
//     recentlyJoined?: boolean;
// }

// export const WaitlistSuccessModal = ({ onClick, recentlyJoined = false, ...modalProps }: Props & ModalStateProps) => {
//     const href = getKnowledgeBaseUrl('/lumo');
//     return (
//         <LumoPrompt
//             {...modalProps}
//             buttons={[
//                 <ButtonLike as="a" color="norm" href={href} target="_self">
//                     {c('collider_2025: Button').t`Learn more about ${LUMO_SHORT_APP_NAME}`}
//                 </ButtonLike>,
//             ]}
//             image={{
//                 src: recentlyJoined ? lumoWaitlistSuccess : lumoWaitlistBox,
//             }}
//             title={
//                 recentlyJoined
//                     ? c('collider_2025: Title').t`You're on the list`
//                     : c('collider_2025: Title').t`You're on the waitlist`
//             }
//             info={
//                 recentlyJoined
//                     ? c('collider_2025: Waitlist Info')
//                           .t`Thanks for joining the waitlist. We’ll email you when you can start chatting with ${LUMO_SHORT_APP_NAME}.`
//                     : c('collider_2025: Waitlist Info')
//                           .t`Thanks for signing up. We’re gradually opening access to ${LUMO_SHORT_APP_NAME} and will let you know when your spot opens.`
//             }
//         />
//     );
// };
