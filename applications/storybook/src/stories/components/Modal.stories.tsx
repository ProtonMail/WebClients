import { useState } from 'react';

import {
    AlertModal,
    BasicModal,
    Button,
    Form,
    Icon,
    InputFieldTwo,
    ModalProps,
    ModalSize,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    RadioGroup,
    Tooltip,
    useModalState,
} from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Modal.mdx';

export default {
    component: ModalTwo,
    subcomponents: { ModalTwoHeader, AlertModal },
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Example = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button
                className="mr0-5"
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open modal
            </Button>
            <ModalTwo open={open} onClose={() => setOpen(false)}>
                <ModalTwoHeader title="Example Modal" />
                <ModalTwoContent>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export const Primary = () => {
    const [size, setSize] = useState<ModalSize>('medium');
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button
                className="mr0-5"
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open size modal
            </Button>
            <ModalTwo size={size} open={open} onClose={() => setOpen(false)}>
                <ModalTwoHeader title="Size" />
                <ModalTwoContent>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>

                    <div className="mr2">
                        <strong className="block mb1">Shape</strong>
                        <RadioGroup
                            name="selected-shape"
                            onChange={setSize}
                            value={size}
                            options={['small', 'medium', 'large', 'full'].map((size) => ({ value: size, label: size }))}
                        />
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

const WrappedFormModal = (props: ModalProps) => {
    const [name, setName] = useState('');
    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title="Title in ModalHeader" subline="Subline in ModalHeader" />
            <ModalTwoContent>
                <p>I will lose any local state of mine after closing.</p>
                <InputFieldTwo value={name} label="Name" placeholder="e.g. John Fitzgerald..." onValue={setName} />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button>Secondary action</Button>
                <Button color="norm">Primary action</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const UsingUseModalState = () => {
    const [modalProps, setOpen] = useModalState();

    return (
        <div className="text-center">
            <Button
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open modal with useModalState
            </Button>
            <WrappedFormModal {...modalProps} />
        </div>
    );
};

export const Header = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open modal with header extras
            </Button>
            <ModalTwo open={open} onClose={() => setOpen(false)}>
                <ModalTwoHeader title="Title in ModalHeader" subline="Subline in ModalHeader" />
                <ModalTwoContent>
                    <p className="m0">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export const HeaderActions = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open actions modal
            </Button>
            <ModalTwo open={open} onClose={() => setOpen(false)}>
                <ModalTwoHeader
                    actions={[
                        <Tooltip title="Get help">
                            <Button icon shape="ghost">
                                <Icon name="question-circle" />
                            </Button>
                        </Tooltip>,
                        <Tooltip title="Refresh">
                            <Button icon shape="ghost">
                                <Icon name="arrows-rotate" />
                            </Button>
                        </Tooltip>,
                    ]}
                />
                <ModalTwoContent>
                    <p className="m0">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export const ALotOfContent = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open modal with a lot of content
            </Button>
            <ModalTwo open={open} onClose={() => setOpen(false)}>
                <ModalTwoHeader title="Title in header" />
                <ModalTwoContent>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem, voluptatum deserunt rem amet
                        consectetur perspiciatis placeat error doloribus vero voluptate quisquam numquam expedita, ex
                        maxime quas, nemo labore necessitatibus accusamus.
                    </p>
                    <p>
                        Delectus blanditiis corporis et est exercitationem odio itaque vero! Fugiat sit eius minus!
                        Architecto quibusdam nisi ullam impedit vel repellat amet, molestias, beatae repudiandae quis
                        fugit, qui ea assumenda maxime.
                    </p>
                    <p>
                        Deserunt rerum aspernatur sint placeat natus nisi quas, facere nesciunt quos obcaecati at
                        suscipit hic modi incidunt numquam necessitatibus labore? Maxime nisi repellendus enim cum
                        nostrum. Officiis porro fuga asperiores?
                    </p>
                    <p>
                        Voluptates minus soluta, ullam maxime labore vitae saepe porro mollitia beatae perferendis velit
                        quasi quidem. Similique numquam repellendus nulla adipisci dolore tempore tenetur laudantium.
                        Sed debitis eos odit beatae soluta?
                    </p>
                    <p>
                        Deleniti, dicta velit. Magnam optio rerum esse est nisi neque unde quos, natus quam aperiam
                        dignissimos porro harum, maxime sed laudantium voluptas cum nam officiis molestiae. Quas iure
                        dicta consectetur.
                    </p>
                    <p>
                        Dolorum ducimus iste asperiores quibusdam laudantium soluta, doloremque minus incidunt
                        distinctio quod dolorem. Nulla nam vitae rerum impedit iste, accusantium veritatis aut, hic
                        animi optio blanditiis, repellat fugit dicta maxime!
                    </p>
                    <p>
                        Quaerat sequi, quis doloribus vel asperiores unde nam excepturi facere consequuntur delectus
                        officia dolorem et itaque sunt iste, suscipit maiores fugiat minus cum! Et id nostrum, officiis
                        facilis voluptas fugiat.
                    </p>
                    <p>
                        Ratione praesentium atque, eveniet nulla expedita distinctio assumenda odit suscipit non
                        architecto accusamus quaerat quod fuga omnis veniam error reprehenderit. At aut impedit
                        excepturi tenetur nulla molestias possimus totam vitae.
                    </p>
                    <p>
                        Molestiae, delectus quae itaque illum impedit eligendi. Molestiae cumque, nam repellat modi
                        dolorum quisquam sequi voluptates velit repudiandae numquam vel quis. Excepturi adipisci hic
                        velit veritatis tenetur, aliquid quod maiores?
                    </p>
                    <p>
                        Pariatur, sint nostrum accusamus dolorum eveniet esse totam praesentium nemo ipsum mollitia quod
                        ad nisi beatae. Veniam, rem illum ratione alias dolores eos sit officia necessitatibus tempora,
                        earum adipisci iure!
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export const WithFormRoot = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        window.alert(`Form submitted, value: ${value}.`);
    };

    return (
        <div className="text-center">
            <Button
                className="mr0-5"
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open modal with form root
            </Button>
            <ModalTwo open={open} onClose={() => setOpen(false)} as={Form} onSubmit={handleSubmit}>
                <ModalTwoHeader title="Size" />
                <ModalTwoContent>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                    <div className="mt1">
                        <InputFieldTwo
                            label="Name"
                            value={value}
                            onValue={setValue}
                            placeholder="e.g. John Fitzgerald"
                        />
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button
                        onClick={() => {
                            setOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" color="norm">
                        Submit
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export const FullscreenOnMobile = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button
                className="mr0-5"
                onClick={() => {
                    setOpen(true);
                }}
            >
                Open full screen on mobile modal
            </Button>
            <ModalTwo fullscreenOnMobile open={open} onClose={() => setOpen(false)}>
                <ModalTwoHeader />
                <ModalTwoContent>
                    <p>
                        If I&apos;m not full screen you&apos;ll have to make your screen&apos;s width smaller. If you
                        did that and I&apos;m still not fullscreen that means my developers did a shlopey job.
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                        accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet
                        qui vero, blanditiis quos?
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export const Alert = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button onClick={() => setOpen(true)}>Open Alert Modal</Button>
            <AlertModal
                title="Title"
                subline="Subline"
                open={open}
                onClose={() => setOpen(false)}
                buttons={[
                    <Button className="mb0-5" color="danger">
                        Continue
                    </Button>,
                    <Button onClick={() => setOpen(false)}>Cancel</Button>,
                ]}
            >
                <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </AlertModal>
        </div>
    );
};

export const AlertWithOnlyOneButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button onClick={() => setOpen(true)}>Open Alert Modal with only one Button</Button>
            <AlertModal
                title="Title"
                subline="Subline"
                open={open}
                onClose={() => setOpen(false)}
                buttons={<Button onClick={() => setOpen(false)}>I understand</Button>}
            >
                <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </AlertModal>
        </div>
    );
};

export const Basic = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-center">
            <Button onClick={() => setOpen(true)}>Open Basic Modal with only one Button</Button>
            <BasicModal
                title="Title"
                isOpen={open}
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <Button onClick={() => setOpen(false)}>I understand</Button>
                        <Button color="norm" onClick={() => setOpen(false)}>
                            I do not understand
                        </Button>
                    </>
                }
            >
                <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </BasicModal>
        </div>
    );
};
