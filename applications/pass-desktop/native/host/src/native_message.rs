use std::fmt;

use anyhow::Result;
use serde::Serialize;
use serde_json::Value;

// The host deals with two kind of messages but both of them
// have at least those 3 fields
#[derive(Debug)]
pub struct NativeMessage {
    pub message_id: String,
    pub message_type: String,
    pub user_identifier: String,
}

impl TryFrom<&str> for NativeMessage {
    type Error = anyhow::Error;

    fn try_from(request: &str) -> Result<Self> {
        let json: Value = serde_json::from_str(request)?;
        let field = |key| json.get(key).and_then(Value::as_str).unwrap_or_default().to_string();
        Ok(NativeMessage {
            message_id: field("messageId"),
            message_type: field("type"),
            user_identifier: field("userIdentifier"),
        })
    }
}

impl fmt::Display for NativeMessage {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[type={}, message_id={}]", self.message_type, self.message_id)
    }
}

#[derive(Debug)]
pub enum NativeErrorCode {
    HostNotResponding,
    BiometricsFailed,
    SecretNotFound,
    Unknown,
}

impl fmt::Display for NativeErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let code = match self {
            Self::HostNotResponding => "HOST_NOT_RESPONDING",
            Self::BiometricsFailed => "BIOMETRICS_FAILED",
            Self::SecretNotFound => "SECRET_NOT_FOUND",
            Self::Unknown => "UNKNOWN",
        };
        write!(f, "{}", code)
    }
}

#[derive(Serialize)]
struct ErrorResponse {
    #[serde(rename = "messageId")]
    message_id: String,
    #[serde(rename = "type")]
    response_type: String,
    error: String,
}

#[derive(Debug)]
pub struct NativeMessageError {
    pub code: NativeErrorCode,
}

impl NativeMessageError {
    pub fn new(code: NativeErrorCode) -> Self {
        Self { code }
    }

    pub fn to_response(&self, msg: &NativeMessage) -> Result<String> {
        Ok(serde_json::to_string(&ErrorResponse {
            message_id: msg.message_id.clone(),
            response_type: msg.message_type.clone(),
            error: self.code.to_string(),
        })?)
    }
}

impl fmt::Display for NativeMessageError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "NativeMessageError: {}", self.code)
    }
}

impl std::error::Error for NativeMessageError {}
