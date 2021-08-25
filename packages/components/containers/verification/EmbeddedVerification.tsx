import { useEffect, useMemo, useState } from 'react';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

interface EmbeddedVerificationProps {
  token: string;
  methods: HumanVerificationMethodType [];
  onSuccess: (token: string, tokenType: HumanVerificationMethodType) => void;
}

const EmbeddedVerification = ({ token, methods, onSuccess }: EmbeddedVerificationProps) => {
  const [iframeHeight, setIframeHeight] = useState<number | undefined>();

  const handleMessage = (e: MessageEvent) => {
    switch (e.data.type) {
      case 'verification-height': {
        setIframeHeight(e.data.height);
        break
      }

      case 'verification-success': {
        onSuccess(e.data.payload.token, e.data.payload.tokenType)
        break
      }

      default:
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    }
  }, []);

  const src = useMemo(
    () => {
      const url = new URL(window.location.origin)
      const segments = url.host.split('.')
      segments[0] = APPS_CONFIGURATION[APPS.PROTONVERIFICATION].subdomain
      url.hostname = segments.join('.')

      return `${url.toString()}?methods=${methods.join(',')}&token=${token}&origin=${window.location.origin}`
    },
    []
  )

  return (
    <iframe
        style={{ height: `${iframeHeight}px`, width: '100%' }}
        src={src}
        title="verification-iframe"
    />
  )
}

export default EmbeddedVerification
