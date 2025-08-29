# Use a base image suitable for your backend language/framework
FROM node:20.9.0-alpine

# Set the working directory inside the container
WORKDIR /usr/src

# Copy package dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port your application listens on
EXPOSE 5006

# Define the command to run your application
CMD ["npm", "start"]