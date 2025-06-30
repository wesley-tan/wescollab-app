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

## 🚀 Live Demo

**Dashboard**: Browse opportunities and manage posts  
**Public Board**: View all opportunities (no login required)  
**Create Post**: Share ventures with the community

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

## 🗄️ Database Schema

The application uses a PostgreSQL database with the following main tables:

### **Profiles Table**
```sql
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY,              -- Supabase auth user ID
  "email" text UNIQUE NOT NULL,
  "name" text,
  "image" text,
  "googleId" text UNIQUE,
  "role" text DEFAULT 'USER',
  "created_at" timestamptz DEFAULT NOW(),
  "updated_at" timestamptz DEFAULT NOW()
);
```

### **Posts Table**
```sql
CREATE TABLE "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "profiles"("id"),
  "roleTitle" VARCHAR(200) NOT NULL,
  "company" TEXT NOT NULL,
  "roleType" "RoleType" NOT NULL,
  "roleDesc" VARCHAR(2000) NOT NULL,
  "contactDetails" TEXT NOT NULL,
  "isDeleted" BOOLEAN DEFAULT false,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Role Types**
```sql
CREATE TYPE "RoleType" AS ENUM (
  'INTERNSHIP', 'FULL_TIME', 'PART_TIME', 
  'COLLABORATIVE_PROJECT', 'VOLUNTEER', 'RESEARCH'
);
```

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

## 🚢 Deployment

### Vercel Deployment

1. **Connect GitHub Repository**:
   - Import `wesley-tan/wescollab-app` from GitHub
   - Choose main branch

2. **Framework Configuration**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: (Next.js default)
   - **Install Command**: `npm install`

3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ALLOWED_DOMAIN=@wesleyan.edu
   ```

4. **Production Updates**:
   - Update Google OAuth redirect URLs
   - Update Supabase site URL and redirect URLs
   - Test authentication flow

