import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectTimeLeftMs } from '@proton/meet/store/slices/meetingInfo';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import { announcementMessages } from '../messages';
import { AnnouncementPriority } from '../types';
import { useAnnounce } from '../useAnnounce';

// Ordered high → low; each fires once as the remaining time crosses it. The first descriptive
// message doubles as the "countdown is now showing" announcement.
const THRESHOLDS: { ms: number; message: () => string }[] = [
    { ms: 10 * MINUTE, message: announcementMessages.meetingEndingIn10Minutes },
    { ms: 5 * MINUTE, message: announcementMessages.meetingEndingIn5Minutes },
    { ms: 1 * MINUTE, message: announcementMessages.meetingEndingIn1Minute },
    { ms: 15 * SECOND, message: announcementMessages.meetingEndingIn15Seconds },
];

export const useMeetingTimeoutAnnouncements = () => {
    const announce = useAnnounce();

    const timeLeftMs = useMeetSelector(selectTimeLeftMs);

    const firedRef = useRef<Set<number>>(new Set());
    // The duration timer reports 0 until it starts, then jumps to the real remaining time. Defer
    // the baseline until a real value arrives so the initial 0 does not mark every threshold passed.
    const initializedRef = useRef(false);

    useEffect(() => {
        if (timeLeftMs <= 0) {
            return;
        }

        if (!initializedRef.current) {
            initializedRef.current = true;
            // Suppress thresholds already passed when tracking begins (e.g. joining a meeting that
            // is about to end) so we never announce a larger figure than the time actually left.
            for (const { ms } of THRESHOLDS) {
                if (timeLeftMs <= ms) {
                    firedRef.current.add(ms);
                }
            }
            return;
        }

        for (const { ms, message } of THRESHOLDS) {
            if (timeLeftMs <= ms && !firedRef.current.has(ms)) {
                firedRef.current.add(ms);
                announce(message(), {
                    dedupeKey: `meeting-timeout-${ms}`,
                    priority: AnnouncementPriority.High,
                });
                break;
            }
        }
    }, [timeLeftMs, announce]);
};
