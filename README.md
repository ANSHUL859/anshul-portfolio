# Anshul Kumar — Portfolio

A responsive, single-page portfolio for Anshul Kumar, Zoho One Consultant and CRM Automation & Integration Specialist. It combines resume and project information with a Three.js scene featuring a 3D character, animation, and coding-themed holograms.

**Live site:** https://anshul859.github.io/anshul-portfolio/

**GitHub repository:** https://github.com/ANSHUL859/anshul-portfolio

## Features

- Home, about, expertise, experience, projects, and contact sections.
- Interactive 3D scene rendered in the browser with Three.js.
- GLB character model with FBX walk, greeting, and idle animations.
- Coding holograms that cycle through editor, workflow, database, and analytics visuals.
- Scroll-aware character animation, scroll progress indicator, and project-card tilt.
- Responsive layout, web fonts, and email, phone, and LinkedIn contact links.

## Project structure

```text
portfolio/
├── index.html
└── assets/
    ├── animation/
    │   ├── Golf Drive.fbx
    │   ├── Modern Sage-Toned Corporate Lobby.png
    │   ├── Stand To Roll.fbx
    │   ├── Standing Idle 03.fbx
    │   ├── Walking.fbx
    │   └── Waving.fbx
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── environment.js
    │   ├── human.js
    │   ├── main.js
    │   ├── scene.js
    │   ├── ui.js
    │   └── utils.js
    └── models/
        └── model.glb
```

`Golf Drive.fbx` and `Stand To Roll.fbx` are included in the animation assets; the current character flow uses `Walking.fbx`, `Waving.fbx`, and `Standing Idle 03.fbx`.

## Libraries and external resources

This is a static site: it has no package manifest, bundler, or install step. JavaScript modules and fonts are loaded from external CDNs.

### JavaScript

- [Three.js 0.160.0](https://threejs.org/) — 3D scene, renderer, camera, lighting, animation, geometry, textures, and materials. The import map in `index.html` loads it from `unpkg.com`.
- Three.js add-ons, from the same Three.js 0.160.0 distribution:
  - `GLTFLoader` — loads the `.glb` character model.
  - `FBXLoader` — loads `.fbx` character animations.
  - `EffectComposer`, `RenderPass`, and `OutputPass` — configure the rendering pipeline.
  - `RoomEnvironment` — supplies environment reflections.

### Fonts

- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — main interface and body font.
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — labels and code-inspired text.

Both fonts are loaded from Google Fonts.

### Browser APIs

The site also uses native browser capabilities: ES modules and import maps, WebGL, Canvas 2D (for generated textures), `requestAnimationFrame`, DOM events, and the `URL` API. These are platform APIs, not additional third-party packages.

## Run locally

Serve the project directory over HTTP (ES modules and model assets should not be opened directly with a `file://` URL). For example:

1. Open the project folder in VS Code.
2. Start a local static server, such as the **Live Server** VS Code extension.
3. Open the local URL it provides.

Alternatively, if Python is installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

An internet connection is needed for the Three.js modules and Google Fonts hosted by their CDNs.

## Deploy

### GitHub Pages

The repository is configured to publish the `main` branch from its root using GitHub Pages. Push updates to `main`; GitHub Actions builds and publishes the site.

### Netlify

Deploy the contents of the project root—the `index.html` file and `assets/` directory—so `index.html` is at the published root. A ZIP of the project can be uploaded as long as it preserves this same directory structure.

## License

No license has been specified for this project. All rights remain with their respective owners; contact the repository owner before reuse.
