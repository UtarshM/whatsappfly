FROM node:20.19-bullseye

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# CRITICAL: We copy the prisma folder before npm install 
# because the 'postinstall' script in package.json needs 
# the schema.prisma file to generate the client.
COPY prisma ./prisma/

# This will now succeed because the prisma folder exists
RUN npm install

# Copy the rest of the application code
COPY . .

# Railway provides the PORT environment variable
EXPOSE 3001

# Start the Express server
CMD ["npm", "run", "server:start"]
