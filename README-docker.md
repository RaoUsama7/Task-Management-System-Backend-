# Docker Setup for Task Management System

This document explains how to run the Task Management System backend using Docker.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine

## Running the Application with Docker

### Using Docker Compose (Recommended)

This approach will start the NestJS application along with PostgreSQL and MongoDB databases.

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-management-system-backend
   ```

2. Start all services:
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Build the NestJS application
   - Start PostgreSQL database
   - Start MongoDB database
   - Connect them all in a Docker network

3. Access the application at http://localhost:5000

4. To stop all services:
   ```bash
   docker-compose down
   ```

5. To stop and remove volumes (will delete database data):
   ```bash
   docker-compose down -v
   ```

### Using Docker Without Compose

If you want to use only the Docker container for the application (and use external databases):

1. Build the Docker image:
   ```bash
   docker build -t task-manager-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 \
     -e PORT=5000 \
     -e DB_HOST=<your-postgres-host> \
     -e DB_PORT=<your-postgres-port> \
     -e DB_USERNAME=<your-postgres-username> \
     -e DB_PASSWORD=<your-postgres-password> \
     -e DB_NAME=<your-postgres-database> \
     -e JWT_SECRET=<your-jwt-secret> \
     -e JWT_EXPIRES_IN=3600s \
     -e MONGO_URI=<your-mongodb-uri> \
     -d task-manager-backend
   ```

## Environment Variables

You can customize the application by setting these environment variables:

| Variable | Description | Default in docker-compose |
|----------|-------------|--------------------------|
| PORT | Port the application runs on | 5000 |
| DB_HOST | PostgreSQL host | postgres |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USERNAME | PostgreSQL username | postgres |
| DB_PASSWORD | PostgreSQL password | postgres |
| DB_NAME | PostgreSQL database name | taskmanager |
| JWT_SECRET | Secret for JWT tokens | yourSuperSecretKey123!@# |
| JWT_EXPIRES_IN | JWT token expiration | 3600s |
| MONGO_URI | MongoDB connection URI | mongodb://mongodb:27017/taskmanager |

## Docker Deployment

For deploying with Docker on Railway:

1. Make sure your repository includes the Dockerfile.

2. In Railway, add a new service from your repository and select the "Dockerfile" template.

3. Railway will automatically detect the Dockerfile and build your application.

4. Add environment variables in the Railway dashboard to match the required configuration.

5. To use external database services (like Railway's managed PostgreSQL and MongoDB):
   - Provision PostgreSQL and MongoDB services on Railway
   - Use the automatically generated environment variables to connect your app

## Local Development with Docker

For local development, you can use volumes to reflect your changes immediately:

```bash
docker-compose -f docker-compose.dev.yml up
```

This uses hot-reloading to update your application as you make changes. 