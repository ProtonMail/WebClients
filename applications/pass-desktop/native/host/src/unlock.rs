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

pub enum Interception {
    Intercepted(String),
    Continue,
}

pub async fn intercept_unlock(msg: &NativeMessage) -> Result<Interception, NativeMessageError> {
    if msg.message_type != "unlock" {
        return Ok(Interception::Continue);
    }

    info!("Intercept unlock match");

    Biometrics::new_check_presence("Authenticate to continue".to_string()).map_err(presence_check_error)?;

    let secret_vec = Biometrics::get_secret(msg.user_identifier.clone())
        .map_err(|_| NativeMessageError::new(NativeErrorCode::SecretNotFound))?;

    let secret = general_purpose::STANDARD.encode(secret_vec);

    let response = serde_json::to_string(&Response {
        message_id: msg.message_id.clone(),
        response_type: "unlock".to_string(),
        secret,
    })
    .map_err(|_| NativeMessageError::new(NativeErrorCode::Unknown))?;

    info!("Intercept success");

    Ok(Interception::Intercepted(response))
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
