import type { ReactNode } from 'react';
import { useId, useState } from 'react';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Input } from '@proton/atoms/Input/Input';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Checkbox from '@proton/components/components/input/Checkbox';
import Radio from '@proton/components/components/input/Radio';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import Toggle from '@proton/components/components/toggle/Toggle';
import { InputField } from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import NotificationsContainer from '@proton/components/containers/notifications/Container';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

import type { Appearance } from './ThemeScope';
import { ThemeStyles, scopeClass } from './ThemeScope';

type Category = 'Buttons' | 'Fields' | 'Selection' | 'Navigation' | 'Surfaces' | 'Overlays';

const componentNames: Record<string, { design: string; code: string }> = {
    'Step dots': { design: 'Desktop/Onboarding/Step dots', code: 'StepDots · StepDot' },
    Card: { design: 'Web/Card', code: 'Card' },
    Notice: { design: 'Web/Notice', code: 'Banner' },
    Toast: { design: 'Artifact/Toast', code: 'Notification · NotificationButton' },
    Tooltip: { design: 'Web/Tooltip · Desktop/Tooltip', code: 'Tooltip' },
    Menu: { design: 'Web/Menu · Web/Menu item', code: 'DropdownButton · Dropdown · DropdownMenu · DropdownMenuButton' },
    Dialog: {
        design: 'Web/Modal header · Web/Modal footer · Desktop/Modal/Entity header · Desktop/Modal footer',
        code: 'BasicModal',
    },
};

export function ComponentName({ design, code }: { design: string; code: string }) {
    return (
        <div className="lumo-catalog__mapping flex flex-column gap-1 mb-6 lumo-color-glyph-mid">
            <span>{design}</span>
            <div className="flex flex-wrap gap-1">
                {code.split(' · ').map((name) => (
                    <code
                        key={name}
                        className="lumo-catalog__code border lumo-border-mid radius-4 lumo-color-glyph-brand-text lumo-bg-control-fill-mid"
                    >
                        {name}
                    </code>
                ))}
            </div>
        </div>
    );
}

export function Catalog({
    children,
    matrix = false,
}: {
    children: ReactNode | ((appearance: Appearance) => ReactNode);
    matrix?: boolean;
}) {
    return (
        <div className={`lumo-catalog${matrix ? ' lumo-catalog--matrix' : ''}`}>
            {(['light', 'dark'] as const).map((appearance) => (
                <div
                    key={appearance}
                    className={`lumo-catalog__panel min-w-0 p-6 border lumo-border radius-16 lumo-color-glyph lumo-bg-panel ${scopeClass(appearance)}`}
                >
                    {typeof children === 'function' ? children(appearance) : children}
                </div>
            ))}
        </div>
    );
}

function Sample({ title, children }: { title: string; children: ReactNode | ((appearance: Appearance) => ReactNode) }) {
    return (
        <Catalog>
            {(appearance) => (
                <section>
                    <ComponentName {...componentNames[title]} />
                    <div className="flex flex-wrap items-center gap-3">
                        {typeof children === 'function' ? children(appearance) : children}
                    </div>
                </section>
            )}
        </Catalog>
    );
}

const buttonVariants = [
    { label: 'Primary', color: 'norm', shape: 'solid' },
    { label: 'Secondary', color: 'weak', shape: 'solid' },
    { label: 'Outlined', color: 'weak', shape: 'outline' },
    { label: 'Ghost', color: 'weak', shape: 'ghost' },
    { label: 'Danger', color: 'danger', shape: 'outline' },
    { label: 'Danger filled', color: 'danger', shape: 'solid' },
] as const;
const buttonStates = [
    { label: 'Rest', className: '' },
    { label: 'Hover', className: 'is-hover' },
    { label: 'Pressed', className: 'is-active' },
    { label: 'Focused', className: 'display-focus-visible' },
    { label: 'Disabled', className: '', disabled: true },
] as const;

function Buttons() {
    return (
        <>
            <Catalog matrix>
                <ComponentName design="Web/Button" code="Button" />
                <div className="ds-state-matrix__scroll">
                    <table className="ds-state-matrix ds-state-matrix--paired-rows">
                        <thead>
                            <tr>
                                <th scope="col">Variant / size</th>
                                {buttonStates.map(({ label }) => (
                                    <th key={label} scope="col">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {buttonVariants.flatMap(({ label, color, shape }) =>
                                (['medium', 'small'] as const).map((size) => (
                                    <tr key={`${label}-${size}`}>
                                        <th scope="row">
                                            {label}
                                            <small>{size}</small>
                                        </th>
                                        {buttonStates.map((state) => (
                                            <td key={state.label}>
                                                <Button
                                                    color={color}
                                                    shape={shape}
                                                    size={size}
                                                    className={state.className}
                                                    disabled={'disabled' in state && state.disabled}
                                                >
                                                    Save
                                                </Button>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Catalog>
            <Catalog matrix>
                <ComponentName design="Web/Icon button" code="Button" />
                <div className="ds-state-matrix__scroll">
                    <table className="ds-state-matrix ds-state-matrix--paired-rows">
                        <thead>
                            <tr>
                                <th scope="col">Variant / size</th>
                                {[...buttonStates, { label: 'Selected' }].map(({ label }) => (
                                    <th key={label} scope="col">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(['ghost', 'solid'] as const).flatMap((shape) =>
                                (['medium', 'small'] as const).map((size) => (
                                    <tr key={`${shape}-${size}`}>
                                        <th scope="row">
                                            {shape === 'ghost' ? 'Ghost' : 'Secondary'}
                                            <small>{size}</small>
                                        </th>
                                        {[...buttonStates, { label: 'Selected', className: '' }].map((state) => (
                                            <td key={state.label}>
                                                <Button
                                                    icon
                                                    color="weak"
                                                    shape={shape}
                                                    size={size}
                                                    className={state.className}
                                                    disabled={'disabled' in state && state.disabled}
                                                    selected={state.label === 'Selected'}
                                                    aria-pressed={state.label === 'Selected'}
                                                    aria-label="Close"
                                                >
                                                    <IcCross size={size === 'small' ? 4 : 5} />
                                                </Button>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Catalog>
        </>
    );
}

const stateLabels = {
    default: 'Default',
    rest: 'Rest',
    empty: 'Empty',
    filled: 'Filled',
    hover: 'Hover',
    pressed: 'Pressed',
    focus: 'Focused',
    error: 'Error',
    disabled: 'Disabled',
};

type PreviewState = keyof typeof stateLabels;

function StateMatrix({
    design,
    code,
    rows,
    states,
}: {
    design: string;
    code: string;
    rows: { label: string; render: (state: PreviewState, appearance: Appearance) => ReactNode }[];
    states: PreviewState[];
}) {
    return (
        <Catalog matrix>
            {(appearance) => (
                <>
                    <ComponentName design={design} code={code} />
                    <div className="ds-state-matrix__scroll">
                        <table className="ds-state-matrix">
                            <thead>
                                <tr>
                                    <th scope="col">Variant</th>
                                    {states.map((state) => (
                                        <th key={state} scope="col">
                                            {stateLabels[state]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ label, render }) => (
                                    <tr key={label}>
                                        <th scope="row">{label}</th>
                                        {states.map((state) => (
                                            <td key={state} data-preview-state={state}>
                                                {render(state, appearance)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Catalog>
    );
}

const textFieldStates: PreviewState[] = ['empty', 'filled', 'focus', 'error', 'disabled'];
const selectionStates: PreviewState[] = ['default', 'disabled', 'focus'];

function SearchField({ state }: { state: PreviewState }) {
    const [value, setValue] = useState(state === 'empty' ? '' : 'memo');
    const disabled = state === 'disabled';

    return (
        <Input
            type="search"
            inputClassName="lumo-catalog__search-input"
            aria-label="Search library"
            placeholder="Search library"
            prefix={<IcMagnifier size={3} className="color-weak" />}
            suffix={
                value && (
                    <Button
                        icon
                        shape="ghost"
                        size="tiny"
                        aria-label="Clear search"
                        data-preview-ignore-focus
                        disabled={disabled}
                        onClick={() => setValue('')}
                    >
                        <IcCross size={3} />
                    </Button>
                )
            }
            value={value}
            onValue={setValue}
            error={state === 'error'}
            disabled={disabled}
        />
    );
}

function PreviewSelect({ state, appearance }: { state: PreviewState; appearance: Appearance }) {
    const [value, setValue] = useState('en');
    return (
        <SelectTwo
            aria-label="Language"
            value={value}
            onValue={setValue}
            error={state === 'error'}
            disabled={state === 'disabled'}
            dropdownClassName={scopeClass(appearance)}
        >
            <Option value="en" title="English" />
            <Option value="fr" title="French" />
        </SelectTwo>
    );
}

function Fields() {
    return (
        <>
            <StateMatrix
                design="Web/Text input"
                code="InputField · Input · TextAreaTwo"
                states={textFieldStates}
                rows={[
                    {
                        label: 'Single',
                        render: (state) => (
                            <InputField
                                label="What should Lumo call you?"
                                placeholder="Alex"
                                defaultValue={state === 'empty' ? '' : 'Alex'}
                                error={state === 'error' ? 'Enter a name.' : undefined}
                                disabled={state === 'disabled'}
                                assistContainerClassName={state === 'error' ? undefined : 'hidden'}
                            />
                        ),
                    },
                    {
                        label: 'Multiline',
                        render: (state) => (
                            <InputField
                                as={TextAreaTwo}
                                label="What should Lumo know about you?"
                                placeholder="I like clear, short answers."
                                defaultValue={state === 'empty' ? '' : 'I like clear, short answers.'}
                                minRows={3}
                                error={state === 'error' ? 'Enter a description.' : undefined}
                                disabled={state === 'disabled'}
                                assistContainerClassName={state === 'error' ? undefined : 'hidden'}
                            />
                        ),
                    },
                ]}
            />
            <StateMatrix
                design="Web/Search field"
                code="Input"
                states={textFieldStates}
                rows={[
                    {
                        label: 'Search',
                        render: (state) => <SearchField state={state} />,
                    },
                ]}
            />
            <StateMatrix
                design="Web/Select"
                code="SelectTwo · Option"
                states={['rest', 'focus', 'error', 'disabled']}
                rows={[
                    {
                        label: 'Language',
                        render: (state, appearance) => <PreviewSelect state={state} appearance={appearance} />,
                    },
                ]}
            />
        </>
    );
}

function PreviewRadio({ label, state }: { label: string; state: PreviewState }) {
    const id = useId();
    return (
        <Radio
            id={id}
            name={id}
            aria-label={`Radio ${label} ${state}`}
            defaultChecked={label === 'On'}
            disabled={state === 'disabled'}
        />
    );
}

function PreviewToggle({ label, state }: { label: string; state: PreviewState }) {
    const id = useId();
    const [checked, setChecked] = useState(label === 'On');
    return (
        <Toggle
            id={id}
            aria-label={`Switch ${label} ${state}`}
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            disabled={state === 'disabled'}
        />
    );
}

function Selection() {
    return (
        <>
            <StateMatrix
                design="Desktop/Checkbox"
                code="Checkbox"
                states={['rest', 'focus', 'disabled']}
                rows={['Off', 'On'].map((label) => ({
                    label,
                    render: (state) => (
                        <Checkbox
                            aria-label={`Checkbox ${label} ${state}`}
                            defaultChecked={label === 'On'}
                            disabled={state === 'disabled'}
                        />
                    ),
                }))}
            />
            <StateMatrix
                design="Web/Radio"
                code="Radio"
                states={selectionStates}
                rows={['Off', 'On'].map((label) => ({
                    label,
                    render: (state) => <PreviewRadio label={label} state={state} />,
                }))}
            />
            <StateMatrix
                design="Web/Switch"
                code="Toggle"
                states={selectionStates}
                rows={['Off', 'On'].map((label) => ({
                    label,
                    render: (state) => <PreviewToggle label={label} state={state} />,
                }))}
            />
        </>
    );
}

const tabs = [
    { title: 'Skills', content: 'Skills content' },
    { title: 'Connectors', content: 'Connectors content' },
];

const tabStates: PreviewState[] = ['rest', 'hover', 'focus'];

function TabsExample({ variant }: { variant: 'underline' | 'modern' }) {
    const [value, setValue] = useState(0);
    return <Tabs value={value} onChange={setValue} tabs={tabs} variant={variant} contained={variant === 'modern'} />;
}

function StepDotsExample() {
    const [step, setStep] = useState(0);
    return (
        <StepDots>
            {[0, 1, 2].map((index) => (
                <StepDot key={index} index={index + 1} active={step === index} onClick={() => setStep(index)} />
            ))}
        </StepDots>
    );
}

// Function children render once per theme panel, so each panel keeps its own state.
function Navigation() {
    return (
        <>
            <StateMatrix
                design="Web/Library/Tabs"
                code="Tabs"
                states={tabStates}
                rows={[{ label: 'Underline', render: () => <TabsExample variant="underline" /> }]}
            />
            <StateMatrix
                design="Web/Segmented"
                code='Tabs (variant="modern")'
                states={tabStates}
                rows={[{ label: 'Segmented', render: () => <TabsExample variant="modern" /> }]}
            />
            <Sample title="Step dots">{() => <StepDotsExample />}</Sample>
        </>
    );
}

function ToastContent({ onClose }: { onClose?: () => void }) {
    return (
        <span className="inline-flex flex-nowrap items-center gap-3">
            Example saved
            <NotificationButton onClick={onClose}>Undo</NotificationButton>
        </span>
    );
}

function ToastExample() {
    const [visible, setVisible] = useState(true);
    return (
        <div className="lumo-catalog__toast flex flex-column items-start gap-3 w-full">
            {visible ? (
                <NotificationsContainer
                    notifications={[
                        {
                            id: 1,
                            key: 1,
                            type: 'success',
                            isClosing: false,
                            showCloseButton: true,
                            duplicate: { old: undefined, state: 'removed', key: 1 },
                            text: <ToastContent />,
                        },
                    ]}
                    hideNotification={() => setVisible(false)}
                    removeNotification={() => setVisible(false)}
                    removeDuplicate={() => {}}
                />
            ) : (
                <Button onClick={() => setVisible(true)}>Show toast</Button>
            )}
        </div>
    );
}

function Surfaces() {
    return (
        <>
            <Sample title="Card">
                <Card padded={false} background={false} className="p-3 lumo-border radius-12 lumo-bg-panel">
                    Small card
                </Card>
                <Card padded={false} background={false} className="p-5 lumo-border radius-16 lumo-bg-panel">
                    Large card
                </Card>
            </Sample>
            <Sample title="Notice">
                <Banner variant="info">Notifications are off. Enable them to receive task updates.</Banner>
            </Sample>
        </>
    );
}

function Menu({ appearance }: { appearance: Appearance }) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const scope = scopeClass(appearance);
    return (
        <>
            <DropdownButton
                className="lumo-catalog__menu-trigger"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret
            >
                Open menu
            </DropdownButton>
            <Dropdown className={scope} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton className="text-left" onClick={close}>
                        Default action
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left" disabled>
                        Disabled action
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left lumo-color-signal-danger" onClick={close}>
                        Destructive action
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
}

function Dialog({ appearance }: { appearance: Appearance }) {
    const [modal, setModal] = useState(false);
    const scope = scopeClass(appearance);
    return (
        <>
            <Button onClick={() => setModal(true)}>Open dialog</Button>
            <BasicModal
                rootClassName={scope}
                title="Example dialog"
                isOpen={modal}
                onClose={() => setModal(false)}
                footer={
                    <>
                        <Button onClick={() => setModal(false)}>Cancel</Button>
                        <Button color="norm" onClick={() => setModal(false)}>
                            Confirm
                        </Button>
                    </>
                }
            >
                <Input aria-label="Name" placeholder="Name" />
            </BasicModal>
        </>
    );
}

function Overlays() {
    return (
        <>
            <Sample title="Tooltip">
                {(appearance) => (
                    <Tooltip title="Tooltip content" openDelay={0} tooltipClassName={scopeClass(appearance)}>
                        <Button>Hover or Tab to focus</Button>
                    </Tooltip>
                )}
            </Sample>
            <Sample title="Menu">{(appearance) => <Menu appearance={appearance} />}</Sample>
            <Sample title="Dialog">{(appearance) => <Dialog appearance={appearance} />}</Sample>
            <Sample title="Toast">{() => <ToastExample />}</Sample>
        </>
    );
}

export function ComponentGallery({ group }: { group: Category }) {
    return (
        <div className="sb-unstyled">
            <ThemeStyles />
            <section className="ds-section" key={group} id={group.toLowerCase()}>
                {group === 'Buttons' && <Buttons />}
                {group === 'Fields' && <Fields />}
                {group === 'Selection' && <Selection />}
                {group === 'Navigation' && <Navigation />}
                {group === 'Surfaces' && <Surfaces />}
                {group === 'Overlays' && <Overlays />}
            </section>
        </div>
    );
}
