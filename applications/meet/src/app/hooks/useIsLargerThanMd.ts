import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

export const useIsLargerThanMd = () => {
    const { viewportWidth } = useActiveBreakpoint();
    return viewportWidth['>=large'];
};
