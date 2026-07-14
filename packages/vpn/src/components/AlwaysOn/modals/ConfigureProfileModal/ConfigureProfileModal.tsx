import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useProfileGeneration } from '../../../../hooks/useAlwaysOnProfileGeneration';
import type { AlwaysOnPolicy } from '../../../../types/AlwaysOn';
import { InstructionsContent } from '../InstructionsModal/InstructionsContent';
import { ConfigurationForm } from './ConfigurationForm';
import { LoadAndSuccessTransition } from './LoadAndSuccessTransition';
import { hiddenInertProps } from './hiddenInertProps';

interface Props extends ModalProps {
    onConfigured?: (policy: AlwaysOnPolicy) => void;
}

const HEIGHT_TRANSITION = 'height 0.25s ease';

export const ConfigureProfileModal = ({ onConfigured, ...props }: Props) => {
    const [restrictLogins, setRestrictLogins] = useState(false);
    const { step, isForm, isCreated, isInstructions, createdPolicy, generate, reset } = useProfileGeneration();

    const bodyRef = useRef<HTMLDivElement>(null);
    const prevHeightRef = useRef<number | null>(null);
    const [height, setHeight] = useState<number>();

    useLayoutEffect(() => {
        const el = bodyRef.current;
        if (!el) {
            return;
        }
        const next = el.scrollHeight;
        const prev = prevHeightRef.current;
        prevHeightRef.current = next;
        if (prev === null || prev === next) {
            return;
        }
        setHeight(prev);
        const frame = requestAnimationFrame(() => setHeight(next));
        return () => cancelAnimationFrame(frame);
    }, [step]);

    useEffect(() => {
        if (isInstructions && createdPolicy) {
            onConfigured?.(createdPolicy);
        }
    }, [isInstructions, createdPolicy, onConfigured]);

    const handleExit = () => {
        props.onExit?.();
        reset();
        setRestrictLogins(false);
        prevHeightRef.current = null;
        setHeight(undefined);
    };

    const inactiveOutsideForm = hiddenInertProps(!isForm);
    const isAnimating = height !== undefined;

    return (
        <ModalTwo {...props} size="large" onExit={handleExit}>
            <ModalTwoHeader title={c('Title').t`Configure Always-on VPN device profile`} />
            <ModalTwoContent>
                <div
                    style={{ height, transition: HEIGHT_TRANSITION, overflow: isAnimating ? 'hidden' : undefined }}
                    onTransitionEnd={(event) => {
                        if (event.propertyName === 'height') {
                            setHeight(undefined);
                        }
                    }}
                >
                    <div ref={bodyRef}>
                        {isInstructions ? (
                            <InstructionsContent
                                windows={createdPolicy?.Artifacts.windows}
                                rego={createdPolicy?.Artifacts.rego}
                            />
                        ) : (
                            <div className="relative">
                                <div {...inactiveOutsideForm}>
                                    <ConfigurationForm
                                        restrictLogins={restrictLogins}
                                        onRestrictLoginsChange={setRestrictLogins}
                                    />
                                </div>
                                {isForm ? null : <LoadAndSuccessTransition created={isCreated} />}
                            </div>
                        )}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {isInstructions ? (
                    <Button color="norm" shape="solid" className="ml-auto" onClick={props.onClose}>
                        {c('Action').t`Done`}
                    </Button>
                ) : (
                    <>
                        <Button {...inactiveOutsideForm} onClick={props.onClose}>
                            {c('Action').t`Cancel`}
                        </Button>
                        <Button
                            {...inactiveOutsideForm}
                            color="norm"
                            shape="solid"
                            onClick={() => generate({ restrictLogins })}
                        >
                            {c('Action').t`Generate device profile`}
                        </Button>
                    </>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
