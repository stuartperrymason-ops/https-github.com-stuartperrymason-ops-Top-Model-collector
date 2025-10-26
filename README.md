<!--
 * @file README.md
 * @description This file provides an overview of the ModelForge application, its features, and technical architecture using Mermaid diagrams.
 * This program was written by Stuart Mason October 2025.
-->
# ModelForge: Tabletop Model Collector

Welcome to ModelForge, your digital armory for managing tabletop miniatures. This application allows you to catalog your collections, track your painting progress, and organize your forces across all your favorite game systems.

## Key Features

- **Detailed Collection View**: Browse your entire collection with images, descriptions, and current painting status.
- **Progress Dashboard**: Visualize your hobby progress with filterable charts breaking down the status of your models by army and game system.
- **Painting Session Calendar**: Schedule your hobby time, link models to sessions, and keep track of your painting commitments.
- **Paint Collection Management**: Keep a detailed inventory of your hobby paints, including stock levels.
- **Dynamic Theming**: Customize the look and feel of your collection by assigning unique color schemes to each game system.
- **Bulk Data Management**: Easily import your existing collection of models or paints from a CSV file, and bulk-edit paint stock levels.
- **Customizable Settings**: Manage the game systems (including color themes) and armies that make up your collection.
- **AI-Powered Descriptions**: Use the Gemini API to automatically generate rich, flavorful descriptions for your models.

---

## Application Flow Diagrams

These diagrams illustrate the architecture and data flow of the application.

### 1. Overall Data Flow

This diagram shows the high-level architecture, from the user interface down to the database. The frontend is built with React and uses a global Context for state management, which communicates with a backend Express server via a dedicated API service.

```mermaid
graph TD
    subgraph Frontend (Browser)
        A[UI Components <br>(Pages & Modals)] -- Calls functions --> B(DataContext <br>Global State);
        B -- Updates state & triggers re-render --> A;
        B -- Calls API methods --> C(apiService.ts);
    end

    subgraph Backend (Server)
        D[Express Server <br>(server.js)] -- CRUD operations --> E(MongoDB);
    end

    C -- HTTP Requests (fetch) --> D;
    D -- HTTP Responses (JSON) --> C;

    style A fill:#8d99ae,stroke:#2b2d42,stroke-width:2px
    style B fill:#a2d2ff,stroke:#2b2d42,stroke-width:2px
    style C fill:#bde0fe,stroke:#2b2d42,stroke-width:2px
    style D fill:#ffafcc,stroke:#2b2d42,stroke-width:2px
    style E fill:#a7c957,stroke:#2b2d42,stroke-width:2px
```

### 2. User Interaction: Adding a New Model

This sequence diagram details the step-by-step process of a user adding a single new model to their collection through the UI.

```mermaid
sequenceDiagram
    actor User
    participant CollectionPage
    participant ModelFormModal
    participant DataContext
    participant apiService
    participant Server
    participant Database

    User->>CollectionPage: Clicks "Add Model"
    CollectionPage->>ModelFormModal: Opens modal (isModalOpen=true)
    User->>ModelFormModal: Fills out form data
    User->>ModelFormModal: Clicks "Submit"
    ModelFormModal->>DataContext: Calls addModel(formData)
    DataContext->>apiService: Calls addModel(formData)
    apiService->>Server: POST /api/models with model data
    Server->>Database: Inserts new model document
    Database-->>Server: Returns new document with ID
    Server-->>apiService: Returns new model JSON
    apiService-->>DataContext: Returns new model
    DataContext->>DataContext: Updates `models` state with new model
    DataContext-->>CollectionPage: Re-renders with updated models list
    ModelFormModal->>CollectionPage: Closes modal (onClose)
```

### 3. Bulk CSV Import Flow

This flowchart illustrates the logic for importing either models or paints from a CSV file. The process includes validation and a user review step.

```mermaid
graph TD
    A[Start] --> B{User selects CSV file};
    B --> B1{Choose Import Type};
    B1 -- Models --> C[Parse Model CSV];
    B1 -- Paints --> C2[Parse Paint CSV];
    C --> D{Validate each model row};
    C2 --> D2{Validate each paint row};
    D --> E{Any new items, duplicates, or errors?};
    D2 --> E2{Any duplicates or errors?};
    E -- No --> F[Finalize Model Import];
    E -- Yes --> G[Show Model Review Modal];
    E2 -- No --> F2[Finalize Paint Import];
    E2 -- Yes --> G2[Show Paint Review Modal];
    G --> H{User confirms choices};
    G2 --> H2{User confirms choices};
    H --> F;
    H2 --> F2;
    F --> I[1. Create new Game Systems & Armies];
    I --> K[2. Prepare final model list];
    K --> L[3. Call `bulkAddModels`];
    L --> M[Show Model Import Summary];
    F2 --> L2[Call `bulkAddPaints`];
    L2 --> M2[Show Paint Import Summary];
    M --> N[End];
    M2 --> N;

    style G fill:#ffafcc,stroke:#2b2d42,stroke-width:2px
    style G2 fill:#ffafcc,stroke:#2b2d42,stroke-width:2px
    style M fill:#a2d2ff,stroke:#2b2d42,stroke-width:2px
    style M2 fill:#a2d2ff,stroke:#2b2d42,stroke-width:2px
```

### 4. User Interaction: Bulk Updating Paint Stock

This diagram shows the process of a user entering bulk edit mode on the Paints page to update the stock levels for multiple items at once.

```mermaid
sequenceDiagram
    actor User
    participant PaintsPage
    participant DataContext
    participant apiService
    participant Server
    participant Database

    User->>PaintsPage: Clicks "Bulk Edit Stock"
    PaintsPage->>PaintsPage: Enters bulk edit mode
    User->>PaintsPage: Selects multiple paints via checkboxes
    User->>PaintsPage: Enters new stock value in toolbar
    User->>PaintsPage: Clicks "Apply Stock"
    PaintsPage->>DataContext: Calls bulkUpdatePaints(ids, { stock: value })
    DataContext->>apiService: Loops and calls updatePaint(id, { stock: value }) for each ID
    apiService->>Server: PUT /api/paints/:id
    Server->>Database: Updates paint document
    Database-->>Server: Returns updated document
    Server-->>apiService: Returns updated paint JSON
    apiService-->>DataContext: Returns updated paint
    DataContext->>DataContext: Updates `paints` state with all updated paints
    DataContext-->>PaintsPage: Re-renders with updated stock values
    PaintsPage->>PaintsPage: Exits bulk edit mode
```

### 5. User Interaction: Scheduling a Painting Session

This diagram details the flow for adding a new event to the painting calendar.

```mermaid
sequenceDiagram
    actor User
    participant CalendarPage
    participant PaintingSessionFormModal
    participant DataContext
    participant apiService
    participant Server
    participant Database

    User->>CalendarPage: Clicks to add a new session
    CalendarPage->>PaintingSessionFormModal: Opens modal
    User->>PaintingSessionFormModal: Fills out session details (title, date, notes, etc.)
    User->>PaintingSessionFormModal: Clicks "Save Session"
    PaintingSessionFormModal->>DataContext: Calls addPaintingSession(sessionData)
    DataContext->>apiService: Calls addPaintingSession(sessionData)
    apiService->>Server: POST /api/painting-sessions with session data
    Server->>Database: Inserts new session document
    Database-->>Server: Returns new document with ID
    Server-->>apiService: Returns new session JSON
    apiService-->>DataContext: Returns new session object
    DataContext->>DataContext: Updates `paintingSessions` state
    DataContext-->>CalendarPage: Re-renders with the new session visible
    PaintingSessionFormModal->>CalendarPage: Closes modal
```
