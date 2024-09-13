import { useState } from 'react'

import { c } from 'ttag'

import { Button } from '@proton/atoms'

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

export enum SignatureFailDecision {
  Ignore = 'ignore',
  Accept = 'accept',
}

interface Props {
  accept: () => void
  ignore: () => void
}

export default function SignatureCheckFailedModal({ ignore, accept, onClose, ...modalProps }: Props & ModalStateProps) {
  const [decision, setDecision] = useState(SignatureFailDecision.Accept)

  const handleClose = () => {
    ignore()
    onClose()
  }

  const handleSubmit = () => {
    if (decision === SignatureFailDecision.Accept) {
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
            id={SignatureFailDecision.Accept}
            checked={decision === SignatureFailDecision.Accept}
            onChange={() => setDecision(SignatureFailDecision.Accept)}
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
            id={SignatureFailDecision.Ignore}
            checked={decision === SignatureFailDecision.Ignore}
            onChange={() => setDecision(SignatureFailDecision.Ignore)}
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

export const useSignatureCheckFailedModal = () => {
  return useModalTwoStatic(SignatureCheckFailedModal)
}
