use rand::{rngs::SysRng, TryRng};

const KEY_LENGTH: usize = 32;

pub fn generate_encryption_key() -> Vec<u8> {
    random_bytes(KEY_LENGTH)
}

fn random_bytes(count: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; count];
    SysRng.try_fill_bytes(&mut bytes).expect("OS RNG failure");
    bytes
}

#[cfg(test)]
mod tests {
    use super::*;

    mod key {
        use super::*;

        #[test]
        fn key_has_the_correct_length() {
            let key = generate_encryption_key();
            assert_eq!(key.len(), KEY_LENGTH);
        }
    }
}
