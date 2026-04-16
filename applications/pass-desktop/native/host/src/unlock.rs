use anyhow::{Context, Error, Result};
use base64::{engine::general_purpose, Engine};
use log::info;

use serde::Serialize;
use serde_json::{self, Value};
use shared::biometrics::*;

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

fn get_json_field(json_value: &Value, field_value: &str) -> Result<String> {
    json_value
        .get(field_value)
        .and_then(Value::as_str)
        .map(|str| str.to_string())
        .with_context(|| "Request userIdentifier field should be defined in type unlock")
}

pub async fn intercept_unlock(request: &str) -> Result<Interception> {
    let json_value: Value = serde_json::from_str(request)?;
    let type_value = json_value
        .get("type")
        .and_then(Value::as_str)
        .ok_or(Error::msg("Request type field should be defined"))?;
    let type_match = type_value == "unlock";

    if type_match {
        info!("Intercept unlock match");

        let message_id = get_json_field(&json_value, "messageId")?;
        let user_identifier = get_json_field(&json_value, "userIdentifier")?;

        Biometrics::new_check_presence("Authenticate to continue".to_string())?;
        let secret_vec = Biometrics::get_secret(user_identifier.to_string())?;
        let secret = general_purpose::STANDARD.encode(secret_vec);

        let response = serde_json::to_string(&Response {
            message_id,
            response_type: "unlock".to_string(),
            secret,
        })?;

        info!("Intercept success");

        return Ok(Interception::Intercepted(response));
    }

    Ok(Interception::Continue)
}
