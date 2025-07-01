import mdx from './Columns.mdx';

export default {
    title: 'CSS Utilities/Columns',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Columns = () => (
    <div className="w-1/2 self-center">
        <ul className="columns-1 md:columns-2">
            <li>This is</li>
            <li>just</li>
            <li>one</li>
            <li>list</li>
            <li>believe</li>
            <li>me</li>
        </ul>
    </div>
);
