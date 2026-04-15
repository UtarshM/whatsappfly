FROM node:22-bullseye-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies, skip postinstall to avoid premature prisma generate
RUN npm install --ignore-scripts

# Generate Prisma Client explicitly with dummy URL
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsappfly npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3001

CMD ["npm", "run", "server:start"]
