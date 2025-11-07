import { useState } from 'react'

import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'

import type { ModalStateProps } from '@proton/components'
import {
  Form,
  ModalTwo,
  ModalTwoContent,
  ModalTwoFooter,
  ModalTwoHeader,
  Radio,
  Row,
  useModalTwoStatic,
} from '@proton/components'

export type SignatureFailDecision = 'ignore' | 'accept'

export type SignatureCheckFailedModalProps = {
  accept: () => void
  ignore: () => void
}

export function SignatureCheckFailedModal({
  ignore,
  accept,
  onClose,
  ...modalProps
}: SignatureCheckFailedModalProps & ModalStateProps) {
  const [decision, setDecision] = useState<SignatureFailDecision>('accept')

  const handleClose = () => {
    ignore()
    onClose()
  }

  const handleSubmit = () => {
    if (decision === 'accept') {
      accept()
    } else {
      ignore()
    }
    onClose()
  }

  const reason = c('Info')
    .t`The authorship of edits in the document could not be verified. Do you want to mark this document as verified? You can choose to Ignore to decide later.`

  return (
    <ModalTwo as={Form} onClose={handleClose} onSubmit={handleSubmit} size="small" {...modalProps}>
      <ModalTwoHeader title={c('Title').t`Document verification failed`} />
      <ModalTwoContent>
        <p>{reason}</p>
        &nbsp;
        <p>{c('Info').t`What do you want to do?`}</p>
        &nbsp;
        <Row>
          <Radio
            id={'accept'}
            checked={decision === 'accept'}
            onChange={() => setDecision('accept')}
            name="strategy"
            className="inline-flex flex-nowrap"
          >
            <div>
              <strong>{c('Label').t`Mark as verified`}</strong>
              <br />
              <span className="color-weak">{c('Info').t`Failing signatures will be re-signed by you`}</span>
            </div>
          </Radio>
        </Row>
        <Row>
          <Radio
            id={'ignore'}
            checked={decision === 'ignore'}
            onChange={() => setDecision('ignore')}
            name="strategy"
            className="inline-flex flex-nowrap"
          >
            <div>
              <strong>{c('Label').t`Ignore`}</strong>
              <br />
              <span className="color-weak">{c('Info').jt`This message will be presented again later`}</span>
            </div>
          </Radio>
        </Row>
        <hr />
      </ModalTwoContent>
      <ModalTwoFooter>
        <Button type="submit" color="norm">
          {c('Action').t`Continue`}
        </Button>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export function useSignatureCheckFailedModal() {
  return useModalTwoStatic(SignatureCheckFailedModal)
}
