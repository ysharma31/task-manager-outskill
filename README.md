# Task Manager Application

A modern task management application built with React, TypeScript, and Supabase.

## Features

- User authentication (signup/login)
- Task management with priorities and status tracking
- AI-powered subtask generation
- Smart search using vector embeddings
- User profiles with avatar uploads
- Responsive design with beautiful UI

## Setup Instructions

### 1. Supabase Setup

To connect this application to Supabase:

1. **Click the "Supabase" button** in the settings (gear icon at the top of the preview)
2. This will automatically:
   - Create a new Supabase project
   - Set up the database schema with all required tables
   - Configure authentication
   - Set up storage buckets for profile pictures
   - Deploy edge functions for AI features
   - Update your `.env` file with the correct credentials

### 2. Optional: AI Features Setup

For AI-powered features (subtask generation and smart search), you'll need to add an OpenAI API key:

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. In your Supabase dashboard, go to Edge Functions → Secrets
3. Add a new secret with key `OPEN_API_KEY` and your OpenAI API key as the value

### 3. Database Schema

The application includes these tables:
- `profiles` - User profile information
- `tasks` - Main tasks with priorities and status
- `subtasks` - Sub-tasks linked to main tasks
- Vector search capabilities for smart task search

### 4. Features Overview

- **Authentication**: Email/password signup and login
- **Task Management**: Create, update, delete tasks with priority levels
- **AI Subtasks**: Generate subtasks automatically using AI
- **Smart Search**: Find tasks using natural language search
- **Profile Management**: Upload profile pictures and manage user info
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

1. Click the "Supabase" button in settings to set up the database
2. Start the development server (already running)
3. Visit the application and create an account
4. Start managing your tasks!

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: OpenAI GPT-3.5 Turbo and text-embedding-3-large
- **Icons**: Lucide React
- **Build Tool**: Vite
