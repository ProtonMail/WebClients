import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import logo from '@proton/styles/assets/img/meet/logo-with-name.png';

import { clearDesktopAppPreference } from '../../utils/desktopAppDetector';

import './MeetingOpenedInDesktopApp.scss';

export const MeetingOpenedInDesktopApp = () => {
    const history = useHistory();

    return (
        <div className="w-full h-full flex flex-column items-center justify-center">
            <div
                className="absolute top-0 left-0 px-custom py-custom"
                style={{ '--px-custom': '3.75rem', '--py-custom': '2.5rem' }}
            >
                <button
                    className="logo-button rounded-full hidden md:block p-2"
                    onClick={() => history.push('/dashboard')}
                    aria-label={c('Alt').t`Go to dashboard`}
                >
                    <img
                        className="logo cursor-pointer h-custom"
                        style={{ '--h-custom': '2.5rem' }}
                        src={logo}
                        alt=""
                    />
                </button>
            </div>

            <div
                className="flex flex-column items-center justify-center gap-2 w-custom"
                style={{ '--w-custom': '32.5rem' }}
            >
                <div className="flex flex-column gap-3 py-custom" style={{ '--py-custom': '2.5rem' }}>
                    <div className="text-semibold meeting-opened-in-desktop-app-title text-center">{c('Info')
                        .t`This meeting was opened in the ${MEET_APP_NAME} desktop app.`}</div>
                    <div className="color-weak text-lg text-center">{c('Info').t`You can close this tab.`}</div>
                </div>

                <Button
                    className="rounded-full tertiary px-custom py-4"
                    onClick={() => {
                        clearDesktopAppPreference();
                        window.location.reload();
                    }}
                    size="large"
                    style={{ '--px-custom': '5rem' }}
                >{c('Action').t`Stop opening meetings in the desktop app`}</Button>
            </div>
        </div>
    );
};
