# FinTrack Setup Guide

This guide will help you get the FinTrack application running on your system.

## Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- Maven 3.6 or higher
- MySQL 8.0 or higher (for local development)
- Docker & Docker Compose (for containerized deployment)

## Option 1: Run with Docker Compose (Recommended)

This is the easiest way to run the complete application with all dependencies.

1. **Start Docker Desktop** (make sure Docker is running)

2. **Set your OpenAI API Key** (optional, for AI insights feature):
   ```bash
   export OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Run the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html

5. **Stop the application**:
   ```bash
   docker-compose down
   ```

## Option 2: Run Locally (Development)

### Step 1: Setup MySQL Database

1. **Install MySQL** (if not already installed):
   - macOS: `brew install mysql`
   - Ubuntu: `sudo apt install mysql-server`
   - Windows: Download from MySQL website

2. **Start MySQL service**:
   - macOS: `brew services start mysql`
   - Ubuntu: `sudo systemctl start mysql`
   - Windows: Start MySQL service from Services

3. **Create database**:
   ```sql
   mysql -u root -p
   CREATE DATABASE fintrack;
   CREATE USER 'fintrack'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON fintrack.* TO 'fintrack'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Step 2: Configure Backend

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Update database configuration** (if needed):
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/fintrack?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   spring.datasource.username=fintrack
   spring.datasource.password=password
   ```

3. **Set environment variables** (optional):
   ```bash
   export OPENAI_API_KEY=your-openai-api-key-here
   export JWT_SECRET=your-jwt-secret-key
   ```

4. **Run the backend**:
   ```bash
   mvn spring-boot:run
   ```

   The backend will be available at http://localhost:8080

### Step 3: Setup Frontend

1. **Open a new terminal** and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

   The frontend will be available at http://localhost:5173

## Testing the Application

1. **Register a new account** at http://localhost:3000
2. **Login** with your credentials
3. **Add some transactions** to test the functionality
4. **Create budgets** for different categories
5. **Generate AI insights** (if OpenAI API key is configured)

## Troubleshooting

### Backend Issues

- **Database connection errors**: Make sure MySQL is running and the database exists
- **Port 8080 already in use**: Stop other applications using port 8080 or change the port in `application.properties`
- **Lombok compilation errors**: Make sure your IDE has Lombok plugin installed

### Frontend Issues

- **Port 5173 already in use**: Vite will automatically use the next available port
- **API connection errors**: Make sure the backend is running on port 8080
- **Build errors**: Delete `node_modules` and run `npm install` again

### Docker Issues

- **Docker daemon not running**: Start Docker Desktop
- **Port conflicts**: Stop other applications using ports 3000, 8080, or 3306
- **Build failures**: Run `docker-compose down` and try again

## Development Notes

- The backend uses Spring Boot 3 with Java 17
- The frontend uses React 18 with TypeScript and Vite
- Database schema is automatically created by Hibernate
- JWT tokens expire after 24 hours
- CORS is configured to allow requests from localhost:3000

## API Documentation

Once the backend is running, you can access the Swagger UI at:
http://localhost:8080/swagger-ui.html

This provides interactive documentation for all API endpoints.