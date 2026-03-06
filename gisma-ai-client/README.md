# Gisma Agent Frontend

A modern, AI-powered gisma assistant built with Next.js, TypeScript, and Redux.

## Features

- 🔐 **Authentication System**: Secure login/registration with JWT tokens
- 🤖 **AI-Powered Chat**: Intelligent gisma assistant with conversation history
- 📁 **File Management**: Organize conversations and documents in folders
- 🎨 **Modern UI**: Beautiful, responsive design with dark/light mode
- 📱 **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 13
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Icons**: Tabler Icons
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Gisma Agent Backend running

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gisma-copilot-front
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Flow

The application uses Redux for state management with the following authentication flow:

1. **Initial Load**: App checks for existing authentication tokens
2. **Token Refresh**: Automatically refreshes tokens if they exist
3. **User Redirect**: 
   - If authenticated → Chat interface
   - If not authenticated → Homepage with login/register forms
4. **Session Management**: Tokens are stored in HTTP-only cookies

### Redux Store Structure

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

### Key Components

- **HomePage**: Landing page with authentication forms
- **AuthContext**: Redux slice for authentication state
- **LoadingSpinner**: Reusable loading component
- **Chat Interface**: Main application interface for authenticated users

## API Endpoints

The frontend communicates with the backend through these endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get user information

## Project Structure

```
gisma-copilot-front/
├── components/           # React components
│   ├── Chat/            # Chat interface components
│   ├── HomePage/        # Landing page components
│   ├── Global/          # Shared components
│   └── ...
├── store/               # Redux store
│   ├── slices/          # Redux slices
│   ├── hooks.ts         # Typed Redux hooks
│   └── index.ts         # Store configuration
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── pages/               # Next.js pages
└── styles/              # Global styles
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Code Style

The project uses:
- Prettier for code formatting
- ESLint for code linting
- TypeScript for type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
