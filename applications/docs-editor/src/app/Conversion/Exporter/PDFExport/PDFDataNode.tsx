import type { ViewProps, TextProps, LinkProps, ImageWithSrcProp, SVGProps, PathProps } from '@react-pdf/renderer'

export type PDFDataNode =
  | ((
      | ({
          type: 'View'
        } & Omit<ViewProps, 'children'>)
      | ({
          type: 'Text'
        } & Omit<TextProps, 'children'>)
      | ({
          type: 'Link'
        } & Omit<LinkProps, 'children'>)
      | ({
          type: 'Image'
        } & Omit<ImageWithSrcProp, 'children'>)
      | ({
          type: 'Svg'
        } & Omit<SVGProps, 'children'>)
      | ({
          type: 'Path'
        } & Omit<PathProps, 'children'>)
    ) & {
      children?: PDFDataNode[] | string
    })
  | null
