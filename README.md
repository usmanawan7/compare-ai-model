# Multi-Model AI Playground

A comprehensive real-time streaming comparison platform for multiple AI models with user authentication, chat history, and analytics. Compare responses from OpenAI, Anthropic, and xAI models side-by-side with live streaming updates.

## 🚀 Features

### Core Functionality
- **Real-time Streaming**: Watch AI responses stream in real-time across multiple models
- **Concurrent Processing**: All models respond simultaneously for fair comparison
- **Live Status Updates**: See typing indicators, streaming progress, and completion status
- **Markdown Rendering**: Beautiful markdown rendering with syntax highlighting
- **WebSocket Resilience**: Automatic reconnection and graceful error handling
- **Responsive Design**: Works perfectly on desktop and mobile devices

### Authentication & User Management
- **Email-based Authentication**: Simple email + verification code login system
- **JWT Token Management**: Secure authentication with automatic token refresh
- **User Profiles**: Dedicated profile pages with account statistics
- **Session Persistence**: Stay logged in across page refreshes

### Chat History & Analytics
- **Chat History**: Save and view all your AI model comparisons
- **Detailed Results**: View individual model responses with token usage and costs
- **Analytics Dashboard**: Track usage statistics, model performance, and costs
- **User-specific Data**: All data is private and user-specific
- **Delete Management**: Remove individual comparisons or clear all history

### Advanced Features
- **Dark Mode**: Eye-catching dark theme with smooth transitions
- **Mobile Responsive**: Optimized for all screen sizes
- **Token Tracking**: Real-time token usage and cost estimation
- **Model Performance Metrics**: Response times and success rates
- **Export Capabilities**: View and manage your comparison history

## 🏗️ Architecture

### Backend (NestJS)
- **WebSocket Gateway**: Real-time communication with Socket.IO
- **Concurrent Streaming**: Fan-out pattern for parallel model calls
- **Model Services**: Abstracted providers for OpenAI, Anthropic, and xAI
- **MongoDB Integration**: Session, comparison history, and user data storage
- **Authentication System**: JWT-based auth with email verification
- **Analytics Engine**: Real-time usage tracking and statistics
- **Error Handling**: Robust error handling and recovery
- **CORS Configuration**: Secure cross-origin resource sharing

### Frontend (Next.js App Router)
- **Real-time UI**: Live updates with WebSocket integration
- **Component Architecture**: Reusable, modular components with Shadcn/ui
- **State Management**: Jotai atoms for efficient state handling
- **Authentication Flow**: Seamless login/logout with token management
- **Responsive Design**: Mobile-first, accessible design
- **Dark Mode**: Theme switching with persistent preferences
- **TypeScript**: Full type safety throughout

## 🛠️ Tech Stack

### Backend
- **NestJS** - Node.js framework with decorators and dependency injection
- **Socket.IO** - WebSocket communication for real-time streaming
- **MongoDB + Mongoose** - Database with schema validation
- **JWT + Passport** - Authentication and authorization
- **TypeScript** - Full type safety
- **OpenAI SDK** - GPT-4o and GPT-4o Mini models
- **Anthropic SDK** - Claude 3.5 Sonnet models
- **xAI API** - Grok models (mock implementation)
- **Nodemailer** - Email verification (console logging in dev)

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui + Radix UI** - Accessible, customizable components
- **Jotai** - Atomic state management
- **Socket.IO Client** - WebSocket communication
- **React Markdown** - Markdown rendering with syntax highlighting
- **Lucide React** - Beautiful icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- API keys for AI providers (OpenAI, Anthropic)
- Email service (optional, uses console logging in development)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/multi-model-ai-playground
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   XAI_API_KEY=your_xai_api_key_here
   JWT_SECRET=your-super-secret-jwt-key-here
   CORS_ORIGIN=http://localhost:3001
   ```

4. **Start the backend**
   ```bash
   npm run start:dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=http://localhost:3000
   ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001` (or the port shown in your terminal)

## 📁 Project Structure

```
multi-model-ai-playground/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── auth/              # Authentication system
│   │   ├── analytics/         # Analytics and statistics
│   │   ├── chat-history/      # Chat history management
│   │   ├── common/            # Shared DTOs and utilities
│   │   ├── config/            # Configuration files
│   │   ├── database/          # MongoDB schemas
│   │   ├── models/            # AI model services
│   │   ├── playground/        # Main playground logic
│   │   └── websocket/         # WebSocket gateway
│   └── package.json
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── chat-history/  # Chat history page
│   │   │   ├── login/         # Login page
│   │   │   ├── playground/    # Main playground
│   │   │   └── profile/       # User profile
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   └── stores/            # Jotai state management
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/send-code` - Send verification code to email
- `POST /auth/verify-code` - Verify code and get JWT token
- `GET /auth/me` - Get current user info

### Chat History
- `GET /chat-history` - Get user's chat history
- `GET /chat-history/:id` - Get specific comparison details
- `DELETE /chat-history/:id` - Delete specific comparison
- `DELETE /chat-history` - Delete all user history

### Analytics
- `GET /analytics` - Get user analytics and statistics
- `GET /analytics/debug` - Debug endpoint for development

## 📡 WebSocket Events

### Client → Server
- `create_session` - Create a new comparison session
- `join_session` - Join an existing session
- `submit_prompt` - Submit a prompt for comparison

### Server → Client
- `connected` - WebSocket connection established
- `session_created` - New session created
- `joined_session` - Successfully joined session
- `prompt_received` - Prompt received and processing started
- `model_typing` - Model started responding
- `model_stream` - Real-time response chunks
- `model_complete` - Individual model finished
- `comparison_complete` - All models finished
- `prompt_error` - Error occurred

## 🎯 Usage

### Getting Started
1. **Login**: Enter your email and verify with the code sent to your email
2. **Select Models**: Choose which AI models to compare (2-3 models required)
3. **Enter Prompt**: Type your prompt in the text area
4. **Submit**: Click "Start Comparison" to begin
5. **Watch Streaming**: See responses stream in real-time across all models
6. **Compare Results**: Review performance metrics and response quality

### Features Overview
- **Model Selection**: Choose from OpenAI GPT-4o, GPT-4o Mini, and Anthropic Claude 3.5 Sonnet
- **Real-time Streaming**: Watch responses appear character by character
- **Token Tracking**: See token usage and estimated costs for each model
- **Chat History**: All comparisons are automatically saved to your history
- **Analytics**: Track your usage patterns and model performance
- **Dark Mode**: Toggle between light and dark themes
- **Mobile Support**: Fully responsive design for all devices

## 🔧 Configuration

### Model Selection
- **OpenAI GPT-4o**: Advanced reasoning and analysis
- **OpenAI GPT-4o Mini**: Fast and efficient for most tasks
- **Anthropic Claude 3.5 Sonnet**: Advanced reasoning and analysis
- **xAI Grok Beta**: Real-time information (mock implementation)

### Authentication
- **Email Verification**: Simple email + code authentication
- **JWT Tokens**: Secure session management
- **User Data**: Private, user-specific data storage

### Customization
- Modify model configurations in `backend/src/models/`
- Add new providers by extending `BaseModelService`
- Customize UI components in `frontend/src/components/`
- Configure authentication in `backend/src/auth/`
- Adjust analytics tracking in `backend/src/analytics/`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
npm run test:e2e
```

## 📊 Performance & Analytics

### Real-time Performance
- **Concurrent Streaming**: All models respond simultaneously
- **Real-time Updates**: Character-by-character streaming
- **Efficient Rendering**: Optimized React components
- **WebSocket Resilience**: Automatic reconnection and error recovery

### Analytics & Tracking
- **Token Usage**: Real-time tracking of prompt and completion tokens
- **Cost Estimation**: Automatic cost calculation for each model
- **Response Times**: Performance metrics for each comparison
- **Usage Statistics**: Total comparisons, models tested, and activity patterns
- **Model Performance**: Success rates and average response times
- **User Analytics**: Private, user-specific usage insights

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables (MongoDB URI, API keys, JWT secret)
2. Configure CORS origins for your frontend domain
3. Set up email service for production (SMTP configuration)
4. Build the application: `npm run build`
5. Start production server: `npm run start:prod`

### Frontend Deployment
1. Set production environment variables (API URL, WebSocket URL)
2. Build the application: `npm run build`
3. Deploy to your preferred platform (Vercel, Netlify, etc.)
4. Ensure CORS is configured to allow your frontend domain

### Production Considerations
- **Database**: Use MongoDB Atlas or a managed MongoDB service
- **Authentication**: Configure proper JWT secrets and email services
- **CORS**: Set appropriate origins for your production domains
- **API Keys**: Secure your AI provider API keys
- **Monitoring**: Set up logging and monitoring for production use
