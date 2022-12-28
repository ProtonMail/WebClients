import Scroll from './Scroll';
import mdx from './Scroll.mdx';

export default {
    component: Scroll,
    title: 'components/Scroll',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => {
    return (
        <Scroll className="border" style={{ height: 160 }}>
            <div className="px1 text-justify">
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </div>
        </Scroll>
    );
};

export const Horizontal = () => {
    return (
        <Scroll horizontal className="border">
            <div className="px1 py1 flex flex-nowrap">
                <p className="pr2" style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p className="pr2" style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p className="pr2" style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </div>
        </Scroll>
    );
};
