# Use an official Node runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Install a simple server to serve static content
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 5173

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5173"]