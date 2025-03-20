# Health Assistant Frontend

A modern, responsive web interface for the Health Assistant application built with React, TypeScript, and Tailwind CSS.

## Features

- User authentication and profile management
- Personalized health dashboard
- Smart question suggestions based on health condition
- Real-time chat interface with AI health assistant
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
REACT_APP_API_URL=http://localhost:8080
```

## Development

To start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Building for Production

To create a production build:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Main application pages
│   ├── context/        # React context providers
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Application entry point
├── public/             # Static assets
└── package.json        # Project dependencies and scripts
```

## API Integration

The frontend communicates with the following backend endpoints:

- POST `/health_assistant/validate` - User authentication
- GET `/health_assistant/smart-questions` - Fetch personalized questions
- POST `/health_assistant/get` - Chat interaction endpoint

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- React Router v6
- Axios
