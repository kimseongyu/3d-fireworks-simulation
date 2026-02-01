mod utils;

use wasm_bindgen::prelude::*;
use std::cell::RefCell;

const GRAVITY: f32 = 0.05;
const GRID_SIZE: f32 = 0.2;

thread_local! {
    static PARTICLES: RefCell<Vec<Particle>> = RefCell::new(Vec::new());
    static ROCKETS: RefCell<Vec<Rocket>> = RefCell::new(Vec::new());
}

struct Rocket {
    true_pos: [f32; 3],
    velocity: [f32; 3],
}

struct Particle {
    velocities: Vec<f32>,
    true_positions: Vec<f32>,
    particle_count: usize,
}

#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
pub fn create_rocket(true_pos: Vec<f32>, velocity: Vec<f32>) -> usize {
    ROCKETS.with(|rockets| {
        let mut rockets = rockets.borrow_mut();
        let id = rockets.len();
        rockets.push(Rocket {
            true_pos: [true_pos[0], true_pos[1], true_pos[2]],
            velocity: [velocity[0], velocity[1], velocity[2]],
        });
        id
    })
}

#[wasm_bindgen]
pub fn update_rocket(id: usize, delta: f32) -> Vec<f32> {
    ROCKETS.with(|rockets| {
        let mut rockets = rockets.borrow_mut();
        if id >= rockets.len() {
            return Vec::new();
        }
        
        let rocket = &mut rockets[id];
        
        rocket.true_pos[0] += rocket.velocity[0] * delta;
        rocket.true_pos[1] += rocket.velocity[1] * delta;
        rocket.true_pos[2] += rocket.velocity[2] * delta;
        
        vec![
            rocket.true_pos[0],
            rocket.true_pos[1],
            rocket.true_pos[2],
            utils::snap_to_grid(rocket.true_pos[0], GRID_SIZE),
            utils::snap_to_grid(rocket.true_pos[1], GRID_SIZE),
            utils::snap_to_grid(rocket.true_pos[2], GRID_SIZE),
        ]
    })
}

#[wasm_bindgen]
pub fn clear_rockets() {
    ROCKETS.with(|rockets| {
        let mut rockets = rockets.borrow_mut();
        rockets.clear();
    })
}

#[wasm_bindgen]
pub fn create_particle(
    velocities: Vec<f32>,
    true_positions: Vec<f32>,
    particle_count: usize,
) -> usize {
    PARTICLES.with(|particles| {
        let mut particles = particles.borrow_mut();
        let id = particles.len();
        particles.push(Particle {
            velocities,
            true_positions,
            particle_count,
        });
        id
    })
}

#[wasm_bindgen]
pub fn update_particle(id: usize, delta: f32) -> Vec<f32> {
    PARTICLES.with(|particles| {
        let mut particles = particles.borrow_mut();
        if id >= particles.len() {
            return Vec::new();
        }
        
        let particle = &mut particles[id];
        
        for i in 0..particle.particle_count {
            let i3 = i * 3;
            
            particle.velocities[i3 + 2] -= GRAVITY * delta;
            
            particle.true_positions[i3] += particle.velocities[i3] * delta;
            particle.true_positions[i3 + 1] += particle.velocities[i3 + 1] * delta;
            particle.true_positions[i3 + 2] += particle.velocities[i3 + 2] * delta;
        }
        
        let mut snapped = Vec::with_capacity(particle.particle_count * 3);
        for i in 0..particle.particle_count {
            let i3 = i * 3;
            snapped.push(utils::snap_to_grid(particle.true_positions[i3], GRID_SIZE));
            snapped.push(utils::snap_to_grid(particle.true_positions[i3 + 1], GRID_SIZE));
            snapped.push(utils::snap_to_grid(particle.true_positions[i3 + 2], GRID_SIZE));
        }
        
        snapped
    })
}

#[wasm_bindgen]
pub fn clear_particles() {
    PARTICLES.with(|particles| {
        let mut particles = particles.borrow_mut();
        particles.clear();
    })
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
