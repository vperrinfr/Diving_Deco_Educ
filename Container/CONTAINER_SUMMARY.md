# 📦 Résumé de la Version Conteneurisée

## 🎯 Vue d'Ensemble

La version conteneurisée de **Decompression Calculator** est maintenant disponible dans le répertoire `Container/`. Cette implémentation utilise Docker et Docker Compose pour faciliter le déploiement, l'exécution et la maintenance de l'application.

## 📂 Structure du Répertoire Container

```
Container/
├── Dockerfile.frontend          # Image Docker pour le frontend Vue.js + Nginx
├── Dockerfile.backend           # Image Docker pour le backend Node.js/Express
├── docker-compose.yml           # Orchestration des services
├── nginx.conf                   # Configuration Nginx avec proxy et sécurité
├── .dockerignore               # Fichiers exclus des images Docker
├── .env.example                # Template des variables d'environnement
├── start.sh                    # Script de démarrage automatisé
├── stop.sh                     # Script d'arrêt automatisé
├── README.md                   # Documentation complète
├── QUICK_START.md              # Guide de démarrage rapide
└── CONTAINER_SUMMARY.md        # Ce fichier
```

## 🏗️ Architecture Technique

### Services Déployés

#### 1. Frontend (Nginx + Vue.js)
- **Image de base** : `node:20-alpine` (build) + `nginx:alpine` (production)
- **Port exposé** : 80
- **Fonctionnalités** :
  - Build multi-stage pour optimiser la taille de l'image
  - Compression Gzip activée
  - Headers de sécurité configurés
  - Cache des assets statiques (1 an)
  - Proxy inverse vers le backend
  - Support du routing SPA Vue.js
  - Healthcheck intégré

#### 2. Backend (Node.js/Express)
- **Image de base** : `node:20-alpine`
- **Port exposé** : 3001
- **Fonctionnalités** :
  - API REST pour les informations du plongeur
  - Stockage persistant via volume Docker
  - Variables d'environnement configurables
  - Healthcheck intégré
  - Mode production optimisé

### Réseau et Communication
- **Réseau Docker** : `decompression-network` (bridge)
- **Communication interne** : Les services communiquent via leurs noms de service
- **Proxy** : Nginx route `/api/*` vers `http://backend:3001`

### Persistance des Données
- **Volume Docker** : `diver-data`
- **Montage** : `/app/data` dans le conteneur backend
- **Contenu** : Fichier `diver.env` avec les informations du plongeur
- **Persistance** : Les données survivent aux redémarrages des conteneurs

## 🚀 Utilisation

### Démarrage Rapide (3 commandes)

```bash
cd Container
./start.sh
# Accéder à http://localhost
```

### Commandes Principales

| Commande | Description |
|----------|-------------|
| `./start.sh` | Démarre l'application |
| `./start.sh --logs` | Démarre avec affichage des logs |
| `./start.sh --no-cache` | Reconstruit sans cache |
| `./start.sh --restart` | Redémarre l'application |
| `./start.sh --rebuild` | Reconstruit complètement |
| `./stop.sh` | Arrête l'application |
| `./stop.sh --remove-volumes` | Arrête et supprime les volumes |
| `./stop.sh --remove-all` | Nettoyage complet |

### Commandes Docker Compose Directes

```bash
docker-compose up -d              # Démarrer
docker-compose down               # Arrêter
docker-compose logs -f            # Voir les logs
docker-compose ps                 # État des conteneurs
docker-compose restart frontend   # Redémarrer le frontend
docker-compose restart backend    # Redémarrer le backend
```

## 🔒 Sécurité

### Headers HTTP Configurés
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000`

### Bonnes Pratiques Implémentées
- ✅ Images Alpine Linux (légères et sécurisées)
- ✅ Build multi-stage (réduction de la surface d'attaque)
- ✅ Utilisateur non-root dans les conteneurs
- ✅ Healthchecks pour la surveillance
- ✅ Variables d'environnement pour la configuration
- ✅ .dockerignore pour exclure les fichiers sensibles
- ✅ Volumes pour la persistance des données

## 📊 Optimisations

### Performance
- **Compression Gzip** : Réduction de 70-80% de la taille des assets
- **Cache des assets** : Cache navigateur de 1 an pour les fichiers statiques
- **Build multi-stage** : Images finales optimisées (~50MB frontend, ~150MB backend)
- **Node.js production** : Dépendances de production uniquement

### Ressources
- **CPU** : Configurable via `docker-compose.yml`
- **Mémoire** : Configurable via `docker-compose.yml`
- **Réseau** : Bridge Docker isolé
- **Stockage** : Volume Docker avec driver local

## 🔧 Configuration Avancée

### Variables d'Environnement

Créez un fichier `.env` dans le répertoire `Container/` :

```env
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=http://localhost,http://localhost:80
SESSION_SECRET=votre-secret-securise
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Personnalisation des Ports

Modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Frontend sur le port 8080
  backend:
    ports:
      - "3002:3001"  # Backend sur le port 3002
```

### Limites de Ressources

Ajoutez dans `docker-compose.yml` :

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## 💾 Sauvegarde et Restauration

### Sauvegarder les Données

```bash
docker run --rm \
  -v decompression-calculator_diver-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restaurer les Données

```bash
docker run --rm \
  -v decompression-calculator_diver-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup-YYYYMMDD.tar.gz -C /data
```

## 🐛 Dépannage

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| Port déjà utilisé | Modifier les ports dans `docker-compose.yml` |
| Docker non démarré | `open -a Docker` (macOS) ou `sudo systemctl start docker` (Linux) |
| Erreur de build | `docker-compose down -v && docker system prune -a` puis rebuild |
| Conteneur ne démarre pas | Vérifier les logs : `docker-compose logs [service]` |
| Problème de réseau | Vérifier : `docker network inspect decompression-calculator_decompression-network` |

### Commandes de Diagnostic

```bash
# État des conteneurs
docker-compose ps

# Logs détaillés
docker-compose logs -f --tail=100

# Utilisation des ressources
docker stats

# Inspecter un conteneur
docker inspect decompression-calculator-frontend

# Tester l'API
curl http://localhost:3001/api/diver-info

# Accéder au shell d'un conteneur
docker-compose exec backend sh
```

## 📈 Monitoring

### Healthchecks

Les deux services incluent des healthchecks automatiques :
- **Intervalle** : 30 secondes
- **Timeout** : 3 secondes
- **Retries** : 3 tentatives
- **Start period** : 5-10 secondes

### Vérification Manuelle

```bash
# Vérifier le statut des healthchecks
docker-compose ps

# Tester le frontend
curl -I http://localhost

# Tester le backend
curl http://localhost:3001/api/diver-info
```

## 🚢 Déploiement en Production

### Checklist de Production

- [ ] Changer `SESSION_SECRET` dans `.env`
- [ ] Configurer HTTPS avec un reverse proxy (Traefik, Nginx)
- [ ] Activer les limites de ressources
- [ ] Configurer les sauvegardes automatiques
- [ ] Mettre en place un système de logging centralisé
- [ ] Configurer les alertes de monitoring
- [ ] Tester les healthchecks
- [ ] Documenter la procédure de rollback

### Recommandations

1. **Reverse Proxy** : Utilisez Traefik ou Nginx avec Let's Encrypt pour HTTPS
2. **Monitoring** : Intégrez Prometheus + Grafana pour la surveillance
3. **Logs** : Utilisez ELK Stack ou Loki pour la centralisation des logs
4. **Backups** : Automatisez les sauvegardes quotidiennes du volume
5. **CI/CD** : Intégrez dans votre pipeline de déploiement

## 📚 Documentation

- **Guide Complet** : [README.md](README.md)
- **Démarrage Rapide** : [QUICK_START.md](QUICK_START.md)
- **Documentation Principale** : [../README.md](../README.md)
- **Guide de Déploiement** : [../DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)

## 🎓 Avantages de la Conteneurisation

### Pour le Développement
- ✅ Environnement cohérent entre développeurs
- ✅ Installation simplifiée (une seule commande)
- ✅ Isolation des dépendances
- ✅ Facilité de test et de debug

### Pour la Production
- ✅ Déploiement reproductible
- ✅ Scalabilité horizontale facile
- ✅ Rollback rapide en cas de problème
- ✅ Monitoring et healthchecks intégrés
- ✅ Isolation et sécurité renforcées

### Pour la Maintenance
- ✅ Mises à jour simplifiées
- ✅ Sauvegardes et restaurations faciles
- ✅ Logs centralisés
- ✅ Diagnostic simplifié

## 🔄 Mises à Jour

### Mettre à Jour l'Application

```bash
# 1. Arrêter l'application
./stop.sh

# 2. Récupérer les dernières modifications
git pull

# 3. Reconstruire et redémarrer
./start.sh --rebuild
```

### Mettre à Jour les Images de Base

```bash
# Mettre à jour les images
docker-compose pull

# Reconstruire avec les nouvelles images
docker-compose build --pull --no-cache

# Redémarrer
docker-compose up -d
```

## 📞 Support

Pour toute question ou problème :
1. Consultez [QUICK_START.md](QUICK_START.md) pour les problèmes courants
2. Vérifiez les logs : `docker-compose logs -f`
3. Consultez la documentation complète dans [README.md](README.md)
4. Ouvrez une issue sur le dépôt Git

## 📝 Notes Importantes

- Les données du plongeur sont persistées dans un volume Docker
- Les conteneurs redémarrent automatiquement en cas d'échec (`restart: unless-stopped`)
- Le frontend et le backend communiquent via un réseau Docker privé
- Les ports peuvent être personnalisés selon vos besoins
- Les scripts `start.sh` et `stop.sh` incluent des vérifications de sécurité

---

**Version Conteneurisée créée le** : 23 décembre 2024  
**Dernière mise à jour** : 23 décembre 2024  
**Statut** : ✅ Production Ready