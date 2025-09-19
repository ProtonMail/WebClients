use rand::{rngs::StdRng, RngCore, SeedableRng};

const KEY_LENGTH: usize = 32;

pub fn generate_encryption_key() -> Vec<u8> {
    random_bytes(KEY_LENGTH)
}

fn random_bytes(count: usize) -> Vec<u8> {
    let mut random_bytes = vec![0; count];
    let mut rng = StdRng::from_os_rng();
    rng.fill_bytes(&mut random_bytes);
    random_bytes.to_vec()
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
