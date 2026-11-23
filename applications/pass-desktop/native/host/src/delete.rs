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
}

pub fn delete_lock_secret(msg: &NativeMessage) -> Result<String, NativeMessageError> {
    info!("Handle delete lock secret");

    Biometrics::delete_secret(msg.user_identifier.clone())
        .map_err(|_| NativeMessageError::new(NativeErrorCode::SecretNotFound))?;

    serde_json::to_string(&Response {
        message_id: msg.message_id.clone(),
        response_type: msg.message_type.clone(),
    })
    .map_err(|_| NativeMessageError::new(NativeErrorCode::Unknown))
}
