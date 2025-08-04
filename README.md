# Dakka - Chat Application

A modern chat application with React frontend and Flask backend.

## 🚀 Live Demo

- **Frontend**: [GitHub Pages](https://as2812.github.io/tv/)
- **Backend**: Configure your own backend deployment

## 📁 Project Structure

```
tv/
├── ser-app/                 # React frontend application
│   ├── src/                # Source code
│   ├── dist/               # Built frontend (production)
│   └── package.json        # Frontend dependencies
├── new-ser-backend/        # Flask backend API
│   ├── src/                # Backend source code
│   ├── requirements.txt    # Python dependencies
│   └── Procfile           # Heroku deployment config
├── .github/workflows/      # GitHub Actions CI/CD
└── docker-compose.yml     # Docker development setup
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/AS2812/tv.git
   cd tv
   ```

2. **Frontend Setup**
   ```bash
   cd ser-app
   npm install
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

3. **Backend Setup**
   ```bash
   cd new-ser-backend
   pip install -r requirements.txt
   python -m src.main
   ```
   Backend will be available at `http://localhost:5000`

### Docker Development

Run the full application with Docker:

```bash
# Full production-like setup
docker-compose up full-app

# Or run frontend and backend separately
docker-compose up frontend backend
```

## 🚀 Deployment Options

### 1. GitHub Pages (Frontend Only)

The frontend is automatically deployed to GitHub Pages on every push to main branch.

- **URL**: `https://as2812.github.io/tv/`
- **Configuration**: See `.github/workflows/deploy.yml`

### 2. Heroku (Backend)

1. Create a Heroku app
2. Set environment variables in GitHub secrets:
   ```
   HEROKU_API_KEY=your_heroku_api_key
   HEROKU_APP_NAME=your_app_name
   HEROKU_EMAIL=your_email
   ```
3. Push to main branch - automatic deployment via GitHub Actions

### 3. Vercel (Full Stack)

1. Connect your GitHub repository to Vercel
2. Set environment variables in GitHub secrets:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```
3. Deploy automatically via GitHub Actions

### 4. Docker Deployment

Build and run the containerized application:

```bash
# Build the image
docker build -t dakka-app .

# Run the container
docker run -p 80:80 dakka-app
```

### 5. Manual VPS Deployment

Use the provided deployment script:

```bash
# Update the paths in deploy.sh to match your server
./deploy.sh
```

## 🔧 Configuration

### Environment Variables

Create `.env` files for different environments:

**Frontend** (`ser-app/.env.production`):
```
VITE_API_URL=https://your-backend-domain.com
```

**Backend** (`new-ser-backend/.env`):
```
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
CORS_ORIGINS=https://your-frontend-domain.com
```

## 📋 Available Scripts

### Frontend (`ser-app/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend (`new-ser-backend/`)
- `python -m src.main` - Start development server
- `gunicorn src.main:app` - Start production server

## 🔍 Monitoring

Check deployment status:
```bash
./check_status.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js and Python versions
2. **CORS errors**: Verify backend URL in frontend configuration
3. **Database issues**: Check database connection and migrations

### Deployment Issues

1. **GitHub Pages not updating**: Check GitHub Actions logs
2. **Heroku deployment fails**: Verify Procfile and requirements.txt
3. **Docker build fails**: Check Dockerfile and dependencies

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure builds pass
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review deployment logs