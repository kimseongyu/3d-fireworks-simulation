pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

pub fn snap_to_grid(value: f32, grid_size: f32) -> f32 {
    (value / grid_size).round() * grid_size
}
