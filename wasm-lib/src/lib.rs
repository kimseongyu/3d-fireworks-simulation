mod utils;

use wasm_bindgen::prelude::*;

const GRAVITY: f32 = 0.05;
const GRID_SIZE: f32 = 0.2;

#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
pub fn update_particles(
    velocities: &[f32],
    true_positions: &[f32],
    particle_count: usize,
    delta: f32,
) -> Vec<f32> {
    let mut result = Vec::with_capacity(particle_count * 6);

    for i in 0..particle_count {
        let i3 = i * 3;

        let vx = velocities[i3];
        let vy = velocities[i3 + 1];
        let mut vz = velocities[i3 + 2];

        vz -= GRAVITY * delta;

        let tx = true_positions[i3] + vx * delta;
        let ty = true_positions[i3 + 1] + vy * delta;
        let tz = true_positions[i3 + 2] + vz * delta;

        result.push(vx);
        result.push(vy);
        result.push(vz);
        result.push(tx);
        result.push(ty);
        result.push(tz);
    }

    result
}

#[wasm_bindgen]
pub fn snap_particle_positions(true_positions: &[f32], particle_count: usize) -> Vec<f32> {
    let mut snapped = Vec::with_capacity(particle_count * 3);
    
    for i in 0..particle_count {
        let i3 = i * 3;
        snapped.push(utils::snap_to_grid(true_positions[i3], GRID_SIZE));
        snapped.push(utils::snap_to_grid(true_positions[i3 + 1], GRID_SIZE));
        snapped.push(utils::snap_to_grid(true_positions[i3 + 2], GRID_SIZE));
    }
    
    snapped
}

#[wasm_bindgen]
pub fn update_rocket_positions(
    true_positions: &[f32],
    velocities: &[f32],
    rocket_count: usize,
    delta: f32,
) -> Vec<f32> {
    let mut result = Vec::with_capacity(rocket_count * 6);
    
    for i in 0..rocket_count {
        let i3 = i * 3;
        
        let tx = true_positions[i3] + velocities[i3] * delta;
        let ty = true_positions[i3 + 1] + velocities[i3 + 1] * delta;
        let tz = true_positions[i3 + 2] + velocities[i3 + 2] * delta;
        
        let sx = utils::snap_to_grid(tx, GRID_SIZE);
        let sy = utils::snap_to_grid(ty, GRID_SIZE);
        let sz = utils::snap_to_grid(tz, GRID_SIZE);
        
        result.push(tx);
        result.push(ty);
        result.push(tz);
        result.push(sx);
        result.push(sy);
        result.push(sz);
    }
    
    result
}

#[wasm_bindgen]
pub fn calculate_explosion_velocities(
    firework_type: u8,
    particle_count: usize,
) -> Vec<f32> {
    let mut velocities = Vec::with_capacity(particle_count * 3);
    
    for i in 0..particle_count {
        let velocity = calculate_velocity(firework_type, i);
        
        velocities.push(velocity.0);
        velocities.push(velocity.1);
        velocities.push(velocity.2);
    }
    
    velocities
}

struct Random {
    state: u32,
}

impl Random {
    fn new(seed: u32) -> Self {
        let state = if seed == 0 { 0x12345678 } else { seed };
        Self { state }
    }

    fn next_f32(&mut self) -> f32 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.state = x;
        (x as f32) / 4294967296.0
    }
}

fn calculate_velocity(
    firework_type: u8,
    index: usize,
) -> (f32, f32, f32) {
    let mut random = Random::new(index as u32 + 987654321);

    random.next_f32();

    let u = random.next_f32();
    let v = random.next_f32();
    let phi = (2.0 * u - 1.0).acos();
    let theta = std::f32::consts::PI * 2.0 * v;

    let dir_x = phi.sin() * theta.cos();
    let dir_y = phi.sin() * theta.sin();
    let dir_z = phi.cos();

    let radius = random.next_f32() * 0.5 + 0.5;
    
    match firework_type {
        0 => {
            // Peony
            let speed = radius * (0.4 + random.next_f32() * 0.3);
            (dir_x * speed, dir_y * speed, dir_z * speed)
        }
        1 => {
            // Chrysanthemum
            let speed = radius * (0.5 + random.next_f32() * 0.4);
            (dir_x * speed, dir_y * speed, dir_z * speed)
        }
        2 => {
            // Willow
            let speed = radius * (0.3 + random.next_f32() * 0.4);
            (
                dir_x * speed * 0.3,
                dir_y * speed * 0.3,
                dir_z * speed * 0.3,
            )
        }
        3 => {
            // Ring
            let len = (dir_x * dir_x + dir_y * dir_y).sqrt().max(0.001);
            let nx = dir_x / len;
            let ny = dir_y / len;
            
            let ring_radius = 2.5;
            let speed = ring_radius * 0.2;
            (nx * speed, ny * speed, 0.0)
        }
        4 => {
            // Palm
            let speed = radius * (0.3 + random.next_f32() * 0.4);
            (
                dir_x * speed * 0.4,
                dir_y * speed * 0.4,
                dir_z * speed * 0.4,
            )
        }
        5 => {
            // MultiBreak
            let break_level = (random.next_f32() * 3.0) as usize;
            let speed = radius * (0.3 + break_level as f32 * 0.25);
            (dir_x * speed, dir_y * speed, dir_z * speed)
        }
        _ => {
            // Default to Peony
            let speed = radius * (0.4 + random.next_f32() * 0.3);
            (dir_x * speed, dir_y * speed, dir_z * speed)
        }
    }
}
