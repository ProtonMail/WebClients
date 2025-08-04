import { useActiveBreakpoint } from '@proton/components';

export const useIsLargerThanMd = () => {
    const { viewportWidth } = useActiveBreakpoint();
    return viewportWidth['>=large'];
};
