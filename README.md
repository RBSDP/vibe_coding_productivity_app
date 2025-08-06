# Productivity App

A comprehensive full-stack productivity application built with React, Node.js, Express, and MongoDB. Features task management with sections, rich text article editor with TipTap, JWT authentication, and Cloudinary image uploads.

## 🚀 Features

### Authentication & Security
- JWT-based authentication
- Role-based access control
- Secure password hashing with bcrypt
- Protected API routes with middleware
- Rate limiting and security headers

### Task Management
- **Sections**: Organize tasks into customizable sections (Work, Personal, etc.)
- **Rich Task Details**: 
  - Task name, description, and notes
  - Due dates with calendar picker
  - Priority levels (Low, Medium, High, Urgent)
  - Status tracking (Pending, In Progress, Completed, Cancelled)
  - Time estimation and tracking
  - Tags for categorization
- **Linked Articles**: Reference articles within tasks
- **Filtering & Search**: Filter by section, status, priority, due date
- **Bulk Operations**: Update multiple tasks at once
- **Statistics**: Task completion analytics

### Article System
- **Rich Text Editor**: TipTap editor with formatting, tables, lists, links
- **Image Upload**: Cloudinary integration for image storage
- **Cross-References**: Link articles to each other
- **Categories & Tags**: Organize content with flexible taxonomy
- **Draft/Published States**: Manage content lifecycle
- **SEO-Friendly**: Auto-generated slugs and meta information
- **Search**: Full-text search across articles
- **View Tracking**: Article view analytics

### User Experience
- **Responsive Design**: Mobile-first Tailwind CSS design
- **Modern UI**: Clean, professional interface with smooth animations
- **Real-time Feedback**: Toast notifications for user actions
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: Graceful error messages and recovery

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for image storage
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend
- **React 18** with functional components and hooks
- **Redux Toolkit** with RTK Query for state management
- **React Router** for navigation
- **TipTap** for rich text editing
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Framer Motion** for animations
- **Lucide React** for icons

### Development Tools
- **Concurrently** for running frontend and backend together
- **Nodemon** for backend development
- **PostCSS** and **Autoprefixer** for CSS processing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Cloudinary account for image uploads

### 1. Clone the Repository
```bash
git clone <repository-url>
cd productivity-app
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 3. Environment Configuration

#### Backend Environment
Create `backend/.env` file (copy from `backend/env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/productivity-app?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Frontend Configuration
The frontend uses a proxy to the backend. Update `frontend/package.json` if needed:
```json
{
  "proxy": "http://localhost:5000"
}
```

### 4. Database Setup
1. Create a MongoDB Atlas cluster or ensure local MongoDB is running
2. Update the `MONGODB_URI` in your `.env` file
3. The application will automatically create collections on first run

### 5. Cloudinary Setup
1. Create a [Cloudinary](https://cloudinary.com) account
2. Get your cloud name, API key, and API secret from the dashboard
3. Add them to your `.env` file

### 6. Start the Application
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
npm run server  # Backend only
npm run client  # Frontend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage

### Getting Started
1. Register a new account or login with existing credentials
2. Start by creating sections to organize your tasks
3. Add tasks with due dates, priorities, and notes
4. Write articles using the rich text editor
5. Link relevant articles to your tasks
6. Use the dashboard to monitor your progress

### Demo Credentials
For testing purposes, you can use:
- Email: demo@example.com  
- Password: password123

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. **Railway Deployment:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway add
   railway deploy
   ```

2. **Render Deployment:**
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables in Render dashboard

### Frontend Deployment (Vercel/Netlify)

1. **Vercel Deployment:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy from frontend directory
   cd frontend
   vercel
   ```

2. **Netlify Deployment:**
   - Connect your GitHub repository
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/build`
   - Update API URLs in frontend code to point to deployed backend

### Environment Variables for Production
Update your production environment variables:
- Set `NODE_ENV=production`
- Update CORS origins in backend to include your frontend domain
- Use production MongoDB URI
- Ensure all secrets are properly configured

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Task Management
- `GET /api/sections` - Get user sections
- `POST /api/sections` - Create section
- `PUT /api/sections/:id` - Update section
- `DELETE /api/sections/:id` - Delete section

- `GET /api/tasks` - Get tasks with filtering
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats/overview` - Get task statistics

### Article Management
- `GET /api/articles` - Get articles
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `GET /api/articles/:identifier` - Get article by ID or slug
- `POST /api/articles/search` - Search articles

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TipTap](https://tiptap.dev/) for the excellent rich text editor
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the beautiful icons
- [Cloudinary](https://cloudinary.com/) for image management
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting

## 📞 Support

If you have any questions or need help with setup, please open an issue or contact the development team.

---

**Happy Productivity! 🎯** 