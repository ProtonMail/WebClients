import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { dismissMeetingSnackbar, selectMeetingSnackbars } from '@proton/meet/store/slices/meetingSnackbarsSlice';
import clsx from '@proton/utils/clsx';

import { MeetingSnackbarItem } from './MeetingSnackbarItem';

export const MeetingSnackbars = () => {
    const dispatch = useMeetDispatch();
    const snackbars = useMeetSelector(selectMeetingSnackbars);

    const { viewportWidth } = useActiveBreakpoint();
    const isLargerThanMd = viewportWidth['>=large'];
    const isFullWidth = viewportWidth['<=small'];

    if (snackbars.length === 0) {
        return null;
    }

    return (
        <div
            className={clsx(
                'absolute bottom-custom left-custom z-up flex flex-column flex-nowrap gap-2',
                !isLargerThanMd && 'mb-2',
                isFullWidth ? 'w-full' : 'w-custom max-w-custom'
            )}
            style={{
                '--bottom-custom': '4.5rem',
                '--left-custom': '50%',
                '--w-custom': '20rem',
                '--max-w-custom': '20rem',
                transform: 'translateX(-50%)',
            }}
        >
            {snackbars.map((snackbar) => (
                <MeetingSnackbarItem
                    key={snackbar.key}
                    snackbar={snackbar}
                    onClose={() => dispatch(dismissMeetingSnackbar(snackbar.key))}
                />
            ))}
        </div>
    );
};
