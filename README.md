<!--
 * @file README.md
 * @description This file provides an overview of the ModelForge application, its features, and technical architecture using Mermaid diagrams.
 * This program was written by Stuart Mason October 2025.
-->
# ModelForge: Tabletop Model Collector

Welcome to ModelForge — a lightweight React + TypeScript app for tracking tabletop miniatures and paints.

This repository uses an in-browser persistence layer (localStorage) via a small service layer and a React Context (`DataContext`) rather than a remote server. The diagrams below show the current runtime flows (import, repair, backups) and the basic UI interactions.

## What changed (short)
- Persistence: localStorage (read/write JSON blobs) instead of an Express/Mongo backend.
- Bulk import now validates rows, offers a review step, creates missing game systems/armies on-the-fly, and performs a bulk add.
- Repair flow: non-destructive in-place repairs backed up to timestamped localStorage keys (tmc_backup_YYYY-MM-DDTHH:MM:SSZ).

---

## Application Flow Diagrams (current)

These diagrams reflect the current implementation: frontend-only app that persists to localStorage through a small apiService abstraction.

### 1. Overall Data Flow (frontend-only)

```mermaid
graph TD
    %% Frontend-only data flow (safer node labels and explicit newlines)
    subgraph Frontend_Browser[Frontend (Browser)]
        A["UI Components\n(Pages & Modals)"]
        B["DataContext\n(global state)"]
        C["apiService.ts\n(localStorage wrapper)"]
        D["localStorage\n(JSON keys)"]
    end

    A -->|calls| B
    B -->|uses| C
    C -->|reads/writes| D
    B -->|re-renders| A

    style A fill:#8d99ae,stroke:#2b2d42,stroke-width:2px
    style B fill:#a2d2ff,stroke:#2b2d42,stroke-width:2px
    style C fill:#bde0fe,stroke:#2b2d42,stroke-width:2px
    style D fill:#f1f5f9,stroke:#2b2d42,stroke-width:2px
```

### 2. Sequence: Adding a New Model (current)

```mermaid
sequenceDiagram
    actor User
sequenceDiagram
    actor User
    participant CollectionPage
    participant ModelFormModal
    participant DataContext
    participant apiService
    participant localStorage

    User->>CollectionPage: Clicks "Add Model"
    CollectionPage->>ModelFormModal: Opens modal
    User->>ModelFormModal: Fills form and submits
    ModelFormModal->>DataContext: calls addModel(formData)
    DataContext->>apiService: calls addModel(formData)
    apiService->>localStorage: writes to models.json
    apiService-->>DataContext: returns newly created model
    DataContext->>CollectionPage: updates state and re-renders
    ModelFormModal->>CollectionPage: closes
### 3. Bulk CSV Import + Repair Flow (current)

This flow shows both import and the non-destructive repair mechanism (with backups).

```mermaid
flowchart TD
    Start([Start]) --> Select["User selects CSV file"]
    Select --> Parse{"Parse CSV\n(PapaParse)"}
    Parse --> Validate["Validate rows"]
    Validate --> Review{"Any new items / duplicates / errors?"}
    Review -- No --> Finalize["Finalize import"]
    Review -- Yes --> ReviewModal["Show Review Modal"]
    ReviewModal --> Confirm{"User confirms creations/import selections"}
    Confirm --> Create["Create missing Game Systems & Armies\n(apiService -> localStorage)"]
    Create --> Prepare["Prepare final model list"]
    Prepare --> BulkAdd["Call bulkAddModels\n(apiService -> localStorage)"]
    BulkAdd --> Summary["Show Import Summary"]

    %% Repair path
    Parse --> RepairPreview["Preview Repair"]
    RepairPreview --> Backup["Save backup to localStorage key: tmc_backup_YYYY-..."]
    Backup --> RepairActions["Create missing systems/armies\nand update matching models"]
    RepairActions --> Summary

    style ReviewModal fill:#ffefc7,stroke:#b07500
    style Backup fill:#f0f9ff,stroke:#2b6cb0
    style BulkAdd fill:#a2d2ff,stroke:#2b2d42
```

Notes:
- Backups are saved as JSON strings under keys starting with `tmc_backup_` and include snapshots of `game-systems.json`, `armies.json`, `models.json`, and `paints.json`.
- The repair preview shows which models match CSV rows and which systems/armies would be created; running the repair will persist a backup first and then apply updates.

---

## Serving the production build locally (PowerShell)

To preview the production build (`dist/`) on your machine you can either use Vite's preview or a tiny static server. This repository includes a convenience script in `package.json` which uses `serve`.

1) Build the app (if you haven't already):

```powershell
npm run build
```

2) Serve the `dist` directory using the included script (recommended):

```powershell
npm run serve-dist
```

This runs `npx serve -s dist -l 5000` and will serve the app at http://localhost:5000 by default.

Alternative (vite preview):

```powershell
npm run preview
```

Alternative lightweight servers:
- Using `npx http-server`:

```powershell
npx http-server dist -p 5000
```

- Or use `npx serve` directly:

```powershell
npx serve -s dist -l 5000
```

Notes:
- The production build uses relative asset paths (`base: './'` in `vite.config.ts`) so serving `dist` from any static server works fine.
- If you open `dist/index.html` directly in the browser without a server, some browsers block requests to hashed assets; use a local server instead for the most consistent results.

---

If you'd like, I can also:
- Add an automatic backup-pruning policy (keep the last N backups).
- Add a page to export/download a selected backup as a JSON file (for cross-machine restore).
- Implement a soft-restore that re-initializes `DataContext` without a full page reload.

If you want any of those, tell me which and I'll implement it next.