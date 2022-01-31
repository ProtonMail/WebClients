import { SubSectionConfig } from '../layout';
import LinkItem from './LinkItem';

interface Props {
    to: string;
    text: string;
    subsections?: SubSectionConfig[];
    available?: boolean;
}
const Sections = ({ to, subsections = [], text, available }: Props) => {
    return (
        <ul className="unstyled mt0-5">
            {subsections.length ? (
                subsections
                    .filter(({ hide }) => !hide)
                    .map(({ text, id, available }) => {
                        return (
                            <li key={id} className="mt0-5 mb0-5">
                                <LinkItem to={`${to}#${id}`} text={text} available={available} />
                            </li>
                        );
                    })
            ) : (
                <li>
                    <LinkItem to={to} text={text} available={available} />
                </li>
            )}
        </ul>
    );
};

export default Sections;
