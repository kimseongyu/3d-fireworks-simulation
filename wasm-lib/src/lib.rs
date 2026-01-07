mod utils;

use wasm_bindgen::prelude::*;

const GRAVITY: f32 = 0.05;
const ALPHA_DECAY: f32 = 0.96;
const ALPHA_THRESHOLD: f32 = 0.05;
const GRID_SIZE: f32 = 0.2;

#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
pub fn update_particles(
    velocities: &mut [f32],
    true_positions: &mut [f32],
    alpha: f32,
    particle_count: usize,
) -> f32 {
    let new_alpha = alpha * ALPHA_DECAY;
    
    if new_alpha < ALPHA_THRESHOLD {
        return new_alpha;
    }

    for i in 0..particle_count {
        let i3 = i * 3;
        let i2 = i * 2;

        velocities[i3 + 1] -= GRAVITY;

        true_positions[i2] += velocities[i3];
        true_positions[i2 + 1] += velocities[i3 + 1];
    }

    new_alpha
}

#[wasm_bindgen]
pub fn snap_particle_positions(true_positions: &[f32], particle_count: usize) -> Vec<f32> {
    let mut snapped = Vec::with_capacity(particle_count * 2);
    
    for i in 0..particle_count {
        let i2 = i * 2;
        snapped.push(utils::snap_to_grid(true_positions[i2], GRID_SIZE));
        snapped.push(utils::snap_to_grid(true_positions[i2 + 1], GRID_SIZE));
    }
    
    snapped
}

#[wasm_bindgen]
pub fn update_rocket_positions(
    true_positions: &mut [f32],
    velocities: &[f32],
    rocket_count: usize,
) -> Vec<f32> {
    let mut snapped = Vec::with_capacity(rocket_count * 3);
    
    for i in 0..rocket_count {
        let i3 = i * 3;
        
        true_positions[i3] += velocities[i3];
        true_positions[i3 + 1] += velocities[i3 + 1];
        true_positions[i3 + 2] += velocities[i3 + 2];
        
        snapped.push(utils::snap_to_grid(true_positions[i3], GRID_SIZE));
        snapped.push(utils::snap_to_grid(true_positions[i3 + 1], GRID_SIZE));
        snapped.push(0.0);
    }
    
    snapped
}

#[wasm_bindgen]
pub fn calculate_explosion_velocities(
    firework_type: u8,
    particle_count: usize,
) -> Vec<f32> {
    let mut velocities = Vec::with_capacity(particle_count * 3);
    
    for i in 0..particle_count {
        let velocity = calculate_velocity(firework_type, i, particle_count);
        
        velocities.push(velocity.0);
        velocities.push(velocity.1);
        velocities.push(velocity.2);
    }
    
    velocities
}

fn calculate_velocity(
    firework_type: u8,
    index: usize,
    particle_count: usize,
) -> (f32, f32, f32) {
    let angle = (std::f32::consts::PI * 2.0 * index as f32) / particle_count as f32;
    
    let mut random_seed: u32 = 12345u32.wrapping_add(index as u32);
    
    random_seed = random_seed.wrapping_mul(1103515245).wrapping_add(12345);
    let radius_rand = (random_seed >> 16) as f32 / 65536.0;
    let radius = radius_rand * 0.5 + 0.5;
    
    let mut rand = || {
        random_seed = random_seed.wrapping_mul(1103515245).wrapping_add(12345);
        (random_seed >> 16) as f32 / 65536.0
    };
    
    match firework_type {
        0 => {
            // Peony
            let speed = radius * (0.4 + rand() * 0.3);
            (angle.cos() * speed, angle.sin() * speed, 0.0)
        }
        1 => {
            // Chrysanthemum
            let speed = radius * (0.5 + rand() * 0.4);
            (angle.cos() * speed, angle.sin() * speed, 0.0)
        }
        2 => {
            // Willow
            let speed = radius * (0.3 + rand() * 0.4);
            (
                angle.cos() * speed * 0.3,
                -angle.sin().abs() * speed * (0.6 + rand() * 0.4),
                0.0,
            )
        }
        3 => {
            // Ring
            let ring_radius = 2.5;
            let speed = ring_radius * 0.2;
            (angle.cos() * speed, angle.sin() * speed, 0.0)
        }
        4 => {
            // Palm
            let speed = radius * (0.3 + rand() * 0.4);
            (
                angle.cos() * speed * 0.4,
                angle.sin().abs() * speed * (0.5 + rand() * 0.3),
                0.0,
            )
        }
        5 => {
            // MultiBreak
            let break_level = (rand() * 3.0) as usize;
            let speed = radius * (0.3 + break_level as f32 * 0.25);
            (angle.cos() * speed, angle.sin() * speed, 0.0)
        }
        _ => {
            // Default to Peony
            let speed = radius * (0.4 + rand() * 0.3);
            (angle.cos() * speed, angle.sin() * speed, 0.0)
        }
    }
}
