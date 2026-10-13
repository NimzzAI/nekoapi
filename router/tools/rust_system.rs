// NekoAPI - Rust High-Performance Engine
// © Nimzz / NekoAPI
use std::io::{self, Read};
use std::time::Instant;

fn fnv1a64(bytes: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for &b in bytes {
        hash ^= b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

fn crc32(bytes: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    for &b in bytes {
        crc ^= b as u32;
        for _ in 0..8 {
            let mask = -( (crc & 1) as i32 ) as u32;
            crc = (crc >> 1) ^ (0xEDB88320 & mask);
        }
    }
    !crc
}

fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 2..=n {
        let c = a.saturating_add(b);
        a = b;
        b = c;
    }
    b
}

fn count_primes(limit: u32) -> usize {
    if limit < 2 {
        return 0;
    }
    let mut is_prime = vec![true; limit as usize + 1];
    is_prime[0] = false;
    is_prime[1] = false;
    let mut p = 2;
    while p * p <= limit {
        if is_prime[p as usize] {
            let mut i = p * p;
            while i <= limit {
                is_prime[i as usize] = false;
                i += p;
            }
        }
        p += 1;
    }
    is_prime.iter().filter(|&&prime| prime).count()
}

fn main() {
    let mut buffer = String::new();
    if io::stdin().read_to_string(&mut buffer).is_err() {
        println!("{{\"status\":false,\"message\":\"Failed to read input stdin\"}}");
        return;
    }

    let start = Instant::now();
    let text = "NekoAPI Rust Backend Fast Compute Engine";
    let hash_val = fnv1a64(text.as_bytes());
    let crc_val = crc32(text.as_bytes());
    let fib_45 = fibonacci(45);
    let prime_count = count_primes(10000);
    let elapsed_micros = start.elapsed().as_micros();

    println!(
        "{{\"status\":true,\"engine\":\"Rust Native\",\"execution_time_us\":{},\"fnv1a64\":\"0x{:016x}\",\"crc32\":\"0x{:08x}\",\"fibonacci_45\":{},\"primes_under_10k\":{}}}",
        elapsed_micros, hash_val, crc_val, fib_45, prime_count
    );
}
