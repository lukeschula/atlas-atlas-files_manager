# Files Manager

This project aims to build a simple platform for users to upload, manage, and view their files. Users can register, authenticate, upload various file types (text, images, and folders), and access their uploaded files.

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Redis
- Project Breakdown

1. Utility Classes
RedisClient: This class handles interactions with a Redis server. It provides functionalities to:
Connect and check connection status.
Get, set, and delete data with expiration times.
DBClient: This class interacts with a MongoDB database. It includes functions to:
Connect and check connection status.
Count documents in specific collections (users and files).
2. API Development
Express Server: An Express server is set up to handle API requests.
Health Check Endpoints: These endpoints provide information on the health of Redis and MongoDB connections and retrieve user/file count statistics.
3. User Management:
User Registration: This endpoint allows users to register by providing an email and password. The system validates email and password (presence and email uniqueness). It stores passwords securely using SHA-1 hashing (Note: Consider more secure hashing algorithms like bcrypt in practice).
User Login: This endpoint enables users to log in using Basic Auth (username:password in Base64 format). Upon successful login, a token is generated and stored in Redis with an expiration time. Subsequent API requests require a valid token in the request header for authorization.
4. File Management:
File Upload: This endpoint facilitates uploading text files, images, and folders. It validates file name, type (text, image, folder), and data presence (except for folders). Optionally, users can specify a parent folder for the uploaded file. Uploaded files are stored locally with unique filenames, and their metadata (name, type, public/private access, parent ID, local path) is saved in the database.
File Retrieval: Endpoints are implemented to retrieve a specific file by its ID and list files based on pagination (20 items per page) and optional parent folder. Token verification secures these endpoints. Pagination is achieved using MongoDB aggregation.

### Learning Objectives

- Building APIs with Express.js
- User authentication and authorization using tokens
- Data storage with MongoDB and Redis
- Uploading and managing files on the backend
- Implementing core backend functionalities
- This project provides a solid foundation for understanding full-stack development concepts.