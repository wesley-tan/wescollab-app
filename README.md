# 🎓 WesCollab - Wesleyan University Venture Board

A community-driven venture board platform where Wesleyan University students, alumni, and partners can discover and share opportunities including internships, full-time roles, and collaborative projects.

## 🌟 Features

### 🔐 **Authentication & Security**
- **Google OAuth Integration** with @wesleyan.edu domain restriction
- **Secure session management** with Supabase Auth
- **Row Level Security (RLS)** for data protection
- **Domain validation** prevents unauthorized access

### 💼 **Opportunity Management**
- **Public Opportunity Board** - Browse all ventures without authentication
- **Create Posts** - Share internships, jobs, and collaborative projects
- **Smart Dashboard** - Opportunities-first design with personal management sidebar
- **Profile Management** - Edit personal information and track activity

### 🎨 **User Experience**
- **Mobile-responsive design** built with Tailwind CSS
- **Real-time updates** with optimistic UI patterns
- **Intuitive navigation** and clean, professional interface
- **Fast performance** with Next.js 14 App Router

### 🛡️ **Data & Privacy**
- **Soft deletion** with 30-day cleanup cycle
- **Validated forms** with Zod schema validation
- **Rate limiting** to prevent spam (10 posts/day per user)
- **GDPR-compliant** data handling


## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Console project

### Installation

```bash
# Clone the repository
git clone https://github.com/wesley-tan/wescollab-app.git
cd wescollab-app

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run database migrations (if using Prisma)
npm run db:push

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Google OAuth Setup

1. **Google Cloud Console**:
   - Create OAuth 2.0 credentials
   - Add authorized origins: `https://your-project.supabase.co`, `http://localhost:3000`
   - Add redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

2. **Supabase Dashboard**:
   - Enable Google provider in Authentication > Providers
   - Add your Google Client ID and Secret
   - Configure site URL and redirect URLs

### Supabase Setup

1. **Create Supabase Project**
2. **Run Database Setup**:
   ```sql
   -- Copy the SQL from scripts/clean-start.sql
   -- Run in Supabase SQL Editor
   ```
3. **Configure Authentication**:
   - Enable Google OAuth provider
   - Set site URL to your domain
   - Add redirect URLs for production


## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth + Google OAuth 2.0
- **Deployment**: Vercel
- **Styling**: Tailwind CSS + Custom UI Components

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_DOMAIN=@wesleyan.edu
```
