# Poster Maker: The Architect & The Editor

A powerful web application for creating and customizing dynamic poster templates.

## ✨ Features

### 🏛️ The Architect (Admin Panel)
- **Draggable Canvas**: Design templates using a drag-and-drop interface.
- **Dynamic Variable Mapping**: Create placeholders like `{{event_name}}` that clients can fill.
- **Asset Library**: Upload backgrounds directly to Cloudinary.
- **Save & Store**: Templates are saved to MongoDB with full layout preservation.

### 🎨 The Editor (Client Panel)
- **Live Preview**: "What You See Is What You Get" (WYSIWYG) editing.
- **Real-time Updates**: As you type in the form, the poster updates instantly.
- **High-Quality Export**: Download the final poster as a high-resolution PNG.

## 🛠️ Tech Stack

- **Frontend**: React, Fabric.js (Canvas), Vite
- **Backend**: Node.js, Express, MongoDB
- **Storage**: Cloudinary (Images)
- **Styling**: Vanilla CSS (Rich Custom Design)

## 🚀 Getting Started

### Prerequisites

1.  **MongoDB URI**: You need a running MongoDB instance.
2.  **Cloudinary Account**: You need a Cloud Name, API Key, and API Secret.

### Installation

1.  **Clone the repository** (if you haven't already).

2.  **Setup the Backend**:
    ```bash
    cd Server
    npm install
    ```
    Create a `.env` file in the `Server` directory:
    ```env
    MONGO_URI=your_mongodb_connection_string
    PORT=5000
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```
    Start the server:
    ```bash
    npm run dev
    # or
    node server.js
    ```

3.  **Setup the Frontend**:
    ```bash
    cd Client
    npm install
    npm run dev
    ```

4.  **Access the App**:
    Open `http://localhost:5173` (or the port Vite assigns).

## 📝 Usage

1.  Go to **/admin** to create your first template.
2.  Upload a background image.
3.  Add text placeholders (e.g., `{{Date}}`).
4.  Save the template.
5.  Go to **/** (Home) to see the client view.
6.  Select your template and fill in the details.
