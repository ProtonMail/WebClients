use base64::{engine::general_purpose, Engine};
use log::info;
use serde::Serialize;
use shared::biometrics::*;

use crate::native_message::{NativeErrorCode, NativeMessage, NativeMessageError};

#[derive(Serialize)]
struct Response {
    #[serde(rename = "messageId")]
    message_id: String,
    #[serde(rename = "type")]
    response_type: String,
    secret: String,
}

// Fallback for extensions older than the localized `reason` field
const DEFAULT_REASON: &str = "Authenticate to continue";

pub async fn unlock(msg: &NativeMessage) -> Result<String, NativeMessageError> {
    info!("Handle unlock");

    let reason = if msg.reason.is_empty() {
        DEFAULT_REASON.to_string()
    } else {
        msg.reason.clone()
    };

    Biometrics::new_check_presence(reason).map_err(presence_check_error)?;

    let secret_vec = Biometrics::get_secret(msg.user_identifier.clone())
        .map_err(|_| NativeMessageError::new(NativeErrorCode::SecretNotFound))?;

    let secret = general_purpose::STANDARD.encode(secret_vec);

    let response = serde_json::to_string(&Response {
        message_id: msg.message_id.clone(),
        response_type: "unlock".to_string(),
        secret,
    })
    .map_err(|_| NativeMessageError::new(NativeErrorCode::Unknown))?;

    info!("Unlock success");

    Ok(response)
}

fn presence_check_error(error: anyhow::Error) -> NativeMessageError {
    NativeMessageError::new(if error.is::<PresenceCheckCancelled>() {
        NativeErrorCode::BiometricsCancelled
    } else {
        NativeErrorCode::BiometricsFailed
    })
}

#[cfg(test)]
mod tests {
    use anyhow::anyhow;

    use super::*;

    #[test]
    fn cancelled_presence_check_maps_to_biometrics_cancelled() {
        let error = presence_check_error(PresenceCheckCancelled.into());
        assert_eq!(error.code.to_string(), "BIOMETRICS_CANCELLED");
    }

    #[test]
    fn failed_presence_check_maps_to_biometrics_failed() {
        let error = presence_check_error(anyhow!("Authentication failure -1"));
        assert_eq!(error.code.to_string(), "BIOMETRICS_FAILED");
    }
}
