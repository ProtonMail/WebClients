import type { ListType } from '@lexical/list'
import { ExportStyles } from '../ExportStyles'
import type { PDFDataNode } from '../PDFDataNode'

export const getListItemNode = ({
  children,
  value,
  listType,
  checked,
}: {
  children: PDFDataNode[] | undefined
  value: number
  listType: ListType
  checked?: boolean
}): PDFDataNode => {
  const marker = listType === 'bullet' ? '\u2022' : `${value}.`

  const markerElement: PDFDataNode =
    listType === 'check'
      ? {
          type: 'View',
          style: {
            width: 14,
            height: 14,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: checked ? '#086dd6' : '#000',
            backgroundColor: checked ? '#086dd6' : 'transparent',
            marginRight: 6,
          },
          children: checked
            ? [
                {
                  type: 'Svg',
                  viewBox: '0 0 20 20',
                  fill: '#ffffff',
                  children: [
                    {
                      type: 'Path',
                      d: 'M17.5001 5.83345L7.50008 15.8334L2.91675 11.2501L4.09175 10.0751L7.50008 13.4751L16.3251 4.65845L17.5001 5.83345Z',
                    },
                  ],
                },
              ]
            : undefined,
        }
      : {
          type: 'View',
          style: ExportStyles.listMarker,
          children: [
            {
              type: 'Text',
              children: marker + ' ',
            },
          ],
        }

  const nonImageChildren: PDFDataNode[] = []
  const imageChildren: PDFDataNode[] = []

  for (const child of children || []) {
    if (!child) {
      continue
    }

    if (child.type === 'Image') {
      imageChildren.push(child)
    } else {
      nonImageChildren.push(child)
    }
  }

  return {
    type: 'View',
    children: [
      {
        type: 'View',
        style: ExportStyles.row,
        children: [
          markerElement,
          {
            type: 'Text',
            style: {
              flex: 1,
              height: '100%',
            },
            children: nonImageChildren,
          },
        ],
      },
      ...imageChildren,
    ],
  }
}
