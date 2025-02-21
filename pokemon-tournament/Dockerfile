# Étape 1 : Construction
FROM node:20-alpine AS builder
WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (ajustez --legacy-peer-deps si nécessaire)
RUN npm install --legacy-peer-deps

# Copier le reste du projet
COPY . .

# Construire l'application Next.js
RUN npm run build

# Étape 2 : Exécution
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copier les fichiers construits depuis l'étape builder
COPY --from=builder /app ./

# Exposer le port utilisé par Next.js
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]