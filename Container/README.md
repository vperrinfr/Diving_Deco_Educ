# Decompression Calculator - Version Conteneurisée

Cette version conteneurisée de l'application Decompression Calculator utilise Docker et Docker Compose pour faciliter le déploiement et l'exécution de l'application.

## 📋 Prérequis

- Docker (version 20.10 ou supérieure)
- Docker Compose (version 2.0 ou supérieure)

## 🏗️ Architecture

L'application est composée de deux services principaux :

1. **Frontend** : Application Vue.js servie par Nginx
   - Port : 80
   - Technologie : Vue 3 + TypeScript + Vite
   - Serveur web : Nginx Alpine

2. **Backend** : API Node.js/Express
   - Port : 3001
   - Technologie : Node.js 20 + Express
   - Stockage : Volume Docker pour les données persistantes

## 🚀 Démarrage Rapide

### 1. Construction et démarrage des conteneurs

Depuis le répertoire racine du projet :

```bash
cd Container
docker-compose up -d
```

Cette commande va :
- Construire les images Docker pour le frontend et le backend
- Créer un réseau Docker privé pour la communication entre services
- Démarrer les conteneurs en arrière-plan
- Créer un volume pour persister les données

### 2. Vérifier l'état des conteneurs

```bash
docker-compose ps
```

### 3. Accéder à l'application

- **Frontend** : http://localhost
- **Backend API** : http://localhost:3001/api

## 🛠️ Commandes Utiles

### Arrêter les conteneurs

```bash
docker-compose down
```

### Arrêter et supprimer les volumes (⚠️ supprime les données)

```bash
docker-compose down -v
```

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Frontend uniquement
docker-compose logs -f frontend

# Backend uniquement
docker-compose logs -f backend
```

### Reconstruire les images

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Redémarrer un service spécifique

```bash
docker-compose restart frontend
docker-compose restart backend
```

### Accéder au shell d'un conteneur

```bash
# Frontend
docker-compose exec frontend sh

# Backend
docker-compose exec backend sh
```

## 📁 Structure des Fichiers

```
Container/
├── Dockerfile.frontend      # Image Docker pour le frontend
├── Dockerfile.backend       # Image Docker pour le backend
├── docker-compose.yml       # Orchestration des services
├── nginx.conf              # Configuration Nginx
├── .dockerignore           # Fichiers à exclure des images
├── .env.example            # Variables d'environnement exemple
└── README.md               # Ce fichier
```

## 🔧 Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et modifiez les valeurs selon vos besoins :

```bash
cp .env.example .env
```

Variables disponibles :
- `NODE_ENV` : Environnement d'exécution (production/development)
- `PORT` : Port du backend (défaut: 3001)
- `ALLOWED_ORIGINS` : Origines autorisées pour CORS
- `SESSION_SECRET` : Secret pour les sessions (à changer en production)

### Personnalisation des ports

Pour changer les ports exposés, modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change le port frontend à 8080
  backend:
    ports:
      - "3002:3001"  # Change le port backend à 3002
```

## 🔒 Sécurité

### Headers de sécurité

Le serveur Nginx est configuré avec les headers de sécurité suivants :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000`

### Healthchecks

Les deux services incluent des healthchecks pour surveiller leur état :
- Intervalle : 30 secondes
- Timeout : 3 secondes
- Retries : 3 tentatives

## 💾 Persistance des Données

Les données du plongeur (diver.env) sont stockées dans un volume Docker nommé `diver-data`. Ce volume persiste même après l'arrêt des conteneurs.

Pour sauvegarder les données :

```bash
docker run --rm -v decompression-calculator_diver-data:/data -v $(pwd):/backup alpine tar czf /backup/diver-data-backup.tar.gz -C /data .
```

Pour restaurer les données :

```bash
docker run --rm -v decompression-calculator_diver-data:/data -v $(pwd):/backup alpine tar xzf /backup/diver-data-backup.tar.gz -C /data
```

## 🐛 Dépannage

### Les conteneurs ne démarrent pas

1. Vérifiez que Docker est en cours d'exécution
2. Vérifiez les logs : `docker-compose logs`
3. Vérifiez que les ports ne sont pas déjà utilisés : `netstat -an | grep LISTEN`

### Erreur de build

1. Nettoyez les images et volumes : `docker system prune -a`
2. Reconstruisez : `docker-compose build --no-cache`

### Le frontend ne peut pas communiquer avec le backend

1. Vérifiez que les deux conteneurs sont sur le même réseau : `docker network inspect decompression-calculator_decompression-network`
2. Vérifiez les logs du backend : `docker-compose logs backend`
3. Testez l'API directement : `curl http://localhost:3001/api/diver-info`

### Problèmes de permissions sur les volumes

```bash
docker-compose down -v
docker volume rm decompression-calculator_diver-data
docker-compose up -d
```

## 📊 Monitoring

### Utilisation des ressources

```bash
docker stats
```

### Inspecter un conteneur

```bash
docker inspect decompression-calculator-frontend
docker inspect decompression-calculator-backend
```

## 🚢 Déploiement en Production

### Recommandations

1. **Utilisez HTTPS** : Configurez un reverse proxy (Traefik, Nginx) avec Let's Encrypt
2. **Changez les secrets** : Modifiez `SESSION_SECRET` dans `.env`
3. **Limitez les ressources** : Ajoutez des limites CPU/mémoire dans `docker-compose.yml`
4. **Sauvegardez régulièrement** : Automatisez les backups du volume `diver-data`
5. **Surveillez les logs** : Utilisez un système de logging centralisé

### Exemple avec limites de ressources

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 📝 Notes

- Les fichiers de build (`node_modules`, `dist`) sont exclus des images via `.dockerignore`
- Le frontend utilise une build multi-stage pour optimiser la taille de l'image
- La compression Gzip est activée sur Nginx pour améliorer les performances
- Les assets statiques sont mis en cache pendant 1 an

## 🤝 Support

Pour toute question ou problème, consultez la documentation principale du projet ou ouvrez une issue sur le dépôt Git.

## 📄 Licence

Voir le fichier LICENSE à la racine du projet.