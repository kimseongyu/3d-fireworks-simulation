# 3D Fireworks Simulation

A 3D fireworks simulation application built with **Next.js**, **Three.js**, and **Rust (WebAssembly)**. This project demonstrates high-performance 3D graphics rendering in the browser and allows users to compare the performance between a pure JavaScript implementation and a Rust-based WebAssembly implementation.

## Features

- **3D Visualization**: Realistic fireworks rendering using Three.js.
- **Dual Rendering Engine**:
  - **JavaScript Mode**: Standard implementation using TypeScript.
  - **WebAssembly Mode**: High-performance implementation using Rust.
- **Firework Types**:
  - **Peony**: Round shaped firework.
  - **Chrysanthemum**: Chrysanthemum shaped firework.
  - **Willow**: Willow tree shaped firework with trailing tails.
  - **Ring**: Ring shaped firework.
  - **Palm**: Palm tree shaped firework.
  - **Multi-Break**: Multi-stage explosion firework.
- **Interactive Controls**: Sidebar interface to switch firework types and rendering engines.
- **State Management**: Efficient state handling using Zustand.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/), [Rust](https://www.rust-lang.org/)
- **Graphics**: [Three.js](https://threejs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **WebAssembly**: [wasm-pack](https://rustwasm.github.io/wasm-pack/), [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen)

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js**: (v18 or higher recommended)
- **Rust**: [Install Rust](https://www.rust-lang.org/tools/install)
- **wasm-pack**: [Install wasm-pack](https://rustwasm.github.io/wasm-pack/installer.html)

## Getting Started

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd 3d-fireworks-simulation
    ```

2.  **Install JavaScript dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Build the WebAssembly module**:
    This step compiles the Rust code in `wasm-lib/` to a WebAssembly package.
    ```bash
    npm run build:wasm
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the application**:
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the simulation.

## Project Structure

```
/
├── app/                  # Next.js App Router pages and layout
├── components/           # React components
│   ├── canvas/           # 3D Canvas and rendering components
│   └── sidebar/          # UI controls and sidebar
├── lib/                  # Utility functions
│   ├── three/            # Three.js logic (JS implementation)
│   └── ...
├── model/                # Data models and configurations
├── store/                # Zustand state management
├── wasm-lib/             # Rust source code for WebAssembly
│   ├── src/              # Rust logic files
│   └── Cargo.toml        # Rust package configuration
└── ...
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [Rust WebAssembly](https://rustwasm.github.io/docs/book/)