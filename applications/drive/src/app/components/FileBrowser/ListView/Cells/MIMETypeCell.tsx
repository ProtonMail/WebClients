interface Props {
    mimeType: string;
}

const MIMETypeCell = ({ mimeType }: Props) => (
    <div key="mimeType" title={mimeType} className="text-ellipsis">
        <span className="text-pre">{mimeType}</span>
    </div>
);

export default MIMETypeCell;
