import { useState } from 'react';

import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { easySwitchRender } from '../../../tests/render';
import { EasySwitchStepModal } from './EasySwitchStepModal';
import { EasySwitchStepModalHost } from './EasySwitchStepModalHost';

describe('EasySwitchStepModal', () => {
    it('renders the step badge, media and content, and triggers the primary action', () => {
        const onClick = vi.fn();

        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                step={{ current: 2, total: 4 }}
                media={<div>media content</div>}
                primaryAction={{ label: 'Continue', onClick }}
            >
                <p>step content</p>
            </EasySwitchStepModal>
        );

        screen.getByText('2 of 4');
        screen.getByText('Step title');
        screen.getByText('media content');
        screen.getByText('step content');

        fireEvent.click(screen.getByText('Continue'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('names the dialog with the step title', () => {
        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            >
                step content
            </EasySwitchStepModal>
        );

        const titleId = screen.getByText('Step title').id;
        expect(titleId).not.toBe('');
        const dialog = document.querySelector('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', titleId);

        // The description holds the content only, so the title is not announced twice
        const descriptionId = dialog?.getAttribute('aria-describedby');
        const description = document.getElementById(descriptionId ?? '');
        expect(description).toHaveTextContent('step content');
        expect(description).not.toHaveTextContent('Step title');
    });

    it('hides the step badge and secondary action when not provided', () => {
        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            >
                content
            </EasySwitchStepModal>
        );

        expect(screen.queryByText(/ of /)).toBeNull();
        // The close button and the primary action only
        expect(screen.getAllByRole('button', { hidden: true })).toHaveLength(2);
    });

    it('wires the secondary action', () => {
        const onSecondaryClick = vi.fn();

        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
                secondaryAction={{ label: 'Maybe later', onClick: onSecondaryClick }}
            >
                content
            </EasySwitchStepModal>
        );

        fireEvent.click(screen.getByText('Maybe later'));
        expect(onSecondaryClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClose from the close button', () => {
        const onClose = vi.fn();

        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                onClose={onClose}
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            />
        );

        fireEvent.click(screen.getByTestId('modal:close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('disables the close button while closeDisabled is set', () => {
        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                onClose={vi.fn()}
                closeDisabled
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            >
                content
            </EasySwitchStepModal>
        );

        expect(screen.getByTestId('modal:close')).toBeDisabled();
    });

    it('does not close with Escape while closeDisabled is set', () => {
        const onClose = vi.fn();

        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                onClose={onClose}
                closeDisabled
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            >
                content
            </EasySwitchStepModal>
        );

        fireEvent.keyDown(document.querySelector('dialog')!, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes with Escape', () => {
        const onClose = vi.fn();

        easySwitchRender(
            <EasySwitchStepModal
                title="Step title"
                onClose={onClose}
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            >
                content
            </EasySwitchStepModal>
        );

        fireEvent.keyDown(document.querySelector('dialog')!, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    describe('inside EasySwitchStepModalHost', () => {
        const FirstStep = ({ onNext }: { onNext: () => void }) => (
            <EasySwitchStepModal title="First" media={null} primaryAction={{ label: 'Next', onClick: onNext }} />
        );
        const SecondStep = ({ onClose }: { onClose: () => void }) => (
            <EasySwitchStepModal
                title="Second"
                media={null}
                onClose={onClose}
                primaryAction={{ label: 'Done', onClick: () => {} }}
            />
        );
        const Flow = ({ onClose }: { onClose: () => void }) => {
            const [isSecond, setIsSecond] = useState(false);
            return (
                <EasySwitchStepModalHost>
                    {isSecond ? <SecondStep onClose={onClose} /> : <FirstStep onNext={() => setIsSecond(true)} />}
                </EasySwitchStepModalHost>
            );
        };

        it('keeps the same dialog open when the step changes', () => {
            easySwitchRender(<Flow onClose={() => {}} />);

            const dialog = document.querySelector('dialog');
            screen.getByText('First');

            fireEvent.click(screen.getByText('Next'));

            screen.getByText('Second');
            expect(document.querySelectorAll('dialog')).toHaveLength(1);
            expect(document.querySelector('dialog')).toBe(dialog);
        });

        it("closes with the current step's onClose", () => {
            const onClose = vi.fn();
            easySwitchRender(<Flow onClose={onClose} />);

            fireEvent.click(screen.getByText('Next'));
            fireEvent.click(screen.getByTestId('modal:close'));

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('blocks Escape and the close button while the step disables closing, then lets it close', () => {
            const onClose = vi.fn();
            const Step = () => {
                const [closeDisabled, setCloseDisabled] = useState(true);
                return (
                    <EasySwitchStepModal
                        title="Step"
                        media={null}
                        onClose={onClose}
                        closeDisabled={closeDisabled}
                        primaryAction={{ label: 'Enable', onClick: () => setCloseDisabled(false) }}
                    />
                );
            };
            easySwitchRender(
                <EasySwitchStepModalHost>
                    <Step />
                </EasySwitchStepModalHost>
            );

            fireEvent.keyDown(document.querySelector('dialog')!, { key: 'Escape' });
            expect(screen.getByTestId('modal:close')).toBeDisabled();
            expect(onClose).not.toHaveBeenCalled();

            fireEvent.click(screen.getByText('Enable'));
            fireEvent.keyDown(document.querySelector('dialog')!, { key: 'Escape' });
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
