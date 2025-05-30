import { type MutableRefObject, type ReactNode, useState } from 'react';

import { Spotlight, useActiveBreakpoint } from '@proton/components';
import PasswordStrengthIndicator, {
    useLoadPasswordStrengthIndicatorWasm,
} from '@proton/components/components/passwordStrengthIndicator/PasswordStrengthIndicator';

export const usePasswordStrengthIndicatorSpotlight = () => {
    const passwordStrengthIndicator = useLoadPasswordStrengthIndicatorWasm();
    const { viewportWidth } = useActiveBreakpoint();
    const [inputFocused, setInputFocus] = useState(false);
    return {
        spotlight: viewportWidth.xlarge || viewportWidth['2xlarge'],
        supported: passwordStrengthIndicator.supported,
        service: passwordStrengthIndicator.service,
        onInputFocus: () => setInputFocus(true),
        onInputBlur: () => setInputFocus(false),
        inputFocused,
    };
};

interface Props {
    children: ReactNode;
    password: string;
    anchorRef: MutableRefObject<HTMLElement | null>;
    wrapper: ReturnType<typeof usePasswordStrengthIndicatorSpotlight>;
}

const PasswordStrengthIndicatorSpotlight = ({ children, anchorRef, password, wrapper }: Props) => {
    if (!wrapper.supported) {
        return children;
    }

    if (!wrapper.spotlight) {
        return (
            <>
                {children}
                {<PasswordStrengthIndicator password={password} className="pb-4" service={wrapper.service} />}
            </>
        );
    }

    return (
        <Spotlight
            originalPlacement="left"
            show={wrapper.inputFocused}
            anchorRef={anchorRef}
            hasClose={false}
            content={
                <PasswordStrengthIndicator
                    password={password}
                    hideWhenEmpty={false}
                    variant="large"
                    showIllustration={false}
                    showGeneratePasswordButton={false}
                    service={wrapper.service}
                />
            }
        >
            {children}
        </Spotlight>
    );
};

export default PasswordStrengthIndicatorSpotlight;
