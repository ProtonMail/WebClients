import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoWaitlistSuccess from '@proton/styles/assets/img/lumo/lumo-waitlist-success.svg';

export const WaitlistSuccessView = ({ recentlyJoined }: { recentlyJoined: boolean }) => {
    return (
        <main className="flex-1 flex flex-column flex-nowrap border-top border-weak reset4print">
            <div
                className="flex flex-column flex-nowrap gap-4 my-auto mx-auto w-custom p-4"
                style={{
                    '--w-custom': '460px',
                }}
            >
                <div className="flex items-center flex-column gap-4">
                    <img
                        className="h-custom w-custom"
                        src={lumoWaitlistSuccess}
                        alt={''}
                        style={{
                            '--w-custom': '12.5rem ',
                            '--h-custom': '7.5rem',
                        }}
                    />
                    <div className="flex flex-column items-center">
                        <span className="lumo-prompt-title block text-bold text-center">
                            {recentlyJoined
                                ? c('collider_2025: Title').t`You're on the list`
                                : c('collider_2025: Title').t`You're on the waitlist`}
                        </span>
                    </div>
                </div>
                <p className="color-weak text-center m-0">
                    {recentlyJoined
                        ? c('collider_2025: Waitlist Info')
                              .t`Thanks for joining the waitlist. We’ll email you when you can start chatting with ${LUMO_SHORT_APP_NAME}.`
                        : c('collider_2025: Waitlist Info')
                              .t`Thanks for signing up. We’re gradually opening access to ${LUMO_SHORT_APP_NAME} and will let you know when your spot opens.`}
                </p>
            </div>
        </main>
    );
};
