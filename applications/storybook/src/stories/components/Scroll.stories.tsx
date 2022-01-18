import { Scroll } from '@proton/components';

import { getTitle } from '../../helpers/title';

import mdx from './Scroll.mdx';

export default {
    component: Scroll,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Primary = () => {
    return (
        <div>
            <div className="border mb2" style={{ height: 160 }}>
                <Scroll>
                    <div className="px1 text-justify">
                        <p style={{ maxWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                        <p style={{ maxWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                        <p style={{ maxWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                        <p style={{ maxWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                    </div>
                </Scroll>
            </div>
            <div className="border">
                <Scroll horizontal>
                    <div className="px1 py1 flex flex-nowrap">
                        <p className="pr2" style={{ minWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                        <p className="pr2" style={{ minWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                        <p className="pr2" style={{ minWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                        <p style={{ minWidth: 400 }}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem
                            accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure
                            amet qui vero, blanditiis quos?
                        </p>
                    </div>
                </Scroll>
            </div>
        </div>
    );
};
