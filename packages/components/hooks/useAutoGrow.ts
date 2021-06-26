import { useState, useCallback } from 'react';

const getTextAreaRows = ({ el, minRows, maxRows }: { el: HTMLTextAreaElement; minRows: number; maxRows: number }) => {
    const textAreaLineHeight = +getComputedStyle(el).lineHeight.replace('px', '');

    const previousRows = el.rows;

    // Reset rows so we can calculate calculate currentRows correctly
    el.rows = minRows;

    const currentRows = Math.min(maxRows, Math.max(minRows, ~~(el.scrollHeight / textAreaLineHeight)));

    // Set rows attribute directly because React won't update it as it stayed the same
    if (currentRows === previousRows) {
        el.rows = currentRows;
    }

    return currentRows;
};

const useAutoGrow = ({ maxRows = 5, minRows = 1, autoGrow = false }) => {
    const [rows, setRows] = useState(minRows);

    const updateTextArea = useCallback(
        (el) => {
            setRows(getTextAreaRows({ el, minRows, maxRows }));
        },
        [minRows, maxRows]
    );

    if (!autoGrow) {
        return {
            rows: maxRows,
        };
    }

    return { rows, updateTextArea };
};

export default useAutoGrow;
