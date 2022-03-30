import { useEffect, useRef, useState } from 'react';
import { useFeature, useWelcomeFlags } from '../../hooks';
import { FeatureCode } from '../features';

const useShouldOpenV5WelcomeModal = () => {
    const [welcomeFlags] = useWelcomeFlags();
    const onceRef = useRef(false);
    const [open, setOpen] = useState(false);
    const { feature, update } = useFeature<boolean>(FeatureCode.SeenV5WelcomeModal);

    useEffect(() => {
        if (!onceRef.current && feature?.Value === false) {
            // Don't care about changes to feature flag
            onceRef.current = true;
            // If the user has not been welcomed (and they didn't get welcomed now), we assume
            // they have never seen V4, and signed up with V5 and thus we set the FF to true
            // so that it doesn't show up on the next reload.
            if (welcomeFlags.isWelcomeFlow === false && welcomeFlags.isDone === false) {
                setOpen(true);
            } else {
                update(true);
            }
        }
    }, [feature?.Value]);

    return open;
};

export default useShouldOpenV5WelcomeModal;
