# 🚀 Démarrage Rapide - Decompression Calculator

Guide ultra-rapide pour démarrer l'application conteneurisée en quelques minutes.

## ⚡ Installation Express (3 étapes)

### 1️⃣ Prérequis
Assurez-vous d'avoir Docker installé et en cours d'exécution :
```bash
docker --version
docker-compose --version
```

### 2️⃣ Démarrage
Depuis le répertoire `Container` :
```bash
cd Container
./start.sh
```

### 3️⃣ Accès
- **Application** : http://localhost
- **API** : http://localhost:3001/api

C'est tout ! 🎉

---

## 📋 Commandes Essentielles

### Démarrer l'application
```bash
./start.sh
```

### Voir les logs en temps réel
```bash
./start.sh --logs
```

### Arrêter l'application
```bash
./stop.sh
```

### Redémarrer l'application
```bash
./start.sh --restart
```

### Reconstruire complètement
```bash
./start.sh --rebuild
```

---

## 🔧 Commandes Docker Compose Directes

Si vous préférez utiliser Docker Compose directement :

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Voir l'état
docker-compose ps

# Redémarrer un service
docker-compose restart frontend
docker-compose restart backend
```

---

## 🐛 Problèmes Courants

### Port déjà utilisé
Si le port 80 ou 3001 est déjà utilisé, modifiez `docker-compose.yml` :
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 80 en 8080
```

### Docker n'est pas démarré
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Windows
# Démarrer Docker Desktop depuis le menu
```

### Erreur de build
```bash
# Nettoyer et reconstruire
docker-compose down -v
docker system prune -a
./start.sh --rebuild
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez [README.md](README.md)

---

## 💡 Astuces

### Sauvegarder les données
```bash
docker run --rm -v decompression-calculator_diver-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .
```

### Restaurer les données
```bash
docker run --rm -v decompression-calculator_diver-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data
```

### Voir l'utilisation des ressources
```bash
docker stats
```

---

## ✅ Checklist de Vérification

- [ ] Docker est installé
- [ ] Docker est en cours d'exécution
- [ ] Les ports 80 et 3001 sont disponibles
- [ ] L'application démarre sans erreur
- [ ] Le frontend est accessible sur http://localhost
- [ ] Le backend répond sur http://localhost:3001/api/diver-info

---

**Besoin d'aide ?** Consultez le [README.md](README.md) complet ou les logs avec `docker-compose logs -f`