# 🚀 Guide de Déploiement - Decompression Calculator

## 📋 Prérequis

Avant de déployer, assurez-vous d'avoir:
- ✅ Node.js 18+ installé
- ✅ Compte GitHub configuré
- ✅ Compte Vercel (pour le frontend)
- ✅ Compte Railway/Render (pour le backend API)

---

## 🔧 Étape 1: Installation des Dépendances de Sécurité

### 1.1 Corriger les vulnérabilités NPM

```bash
npm audit fix
```

### 1.2 Installer les dépendances de sécurité backend

```bash
npm install helmet cors express-rate-limit express-validator
```

### 1.3 Installer les dépendances de chiffrement (optionnel)

```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

---

## 🔐 Étape 2: Configuration de la Sécurité

### 2.1 Créer le fichier .env

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs:
```env
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://votre-domaine.com
SESSION_SECRET=générer-une-clé-secrète-forte-ici
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Générer une clé secrète forte:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 Mettre à jour .gitignore

Vérifier que `.gitignore` contient:
```
.env
.env.local
.env.production
diver.env
node_modules
dist
```

### 2.3 Mettre à jour server/api.js

Ajouter au début du fichier:
```javascript
import { configureSecurityMiddleware, sanitizeInput, errorHandler } from './middleware/security.js';
import { body, validationResult } from 'express-validator';

// Configuration de la sécurité
const { strictLimiter } = configureSecurityMiddleware(app);

// Middleware de sanitization
app.use(sanitizeInput);

// Validation pour POST /api/diver-info
app.post('/api/diver-info', 
  strictLimiter,
  [
    body('firstName').trim().isLength({ min: 1, max: 50 }).escape(),
    body('lastName').trim().isLength({ min: 1, max: 50 }).escape(),
    body('phoneNumber').trim().matches(/^[\d\s\+\-\(\)]+$/),
    body('padiNumber').trim().isLength({ min: 1, max: 20 }).escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Code existant...
  }
);

// Error handler (à la fin)
app.use(errorHandler);
```

---

## 🏗️ Étape 3: Build de Production

### 3.1 Tester le build localement

```bash
npm run build
npm run preview
```

Vérifier que l'application fonctionne correctement sur http://localhost:4173

### 3.2 Vérifier les fichiers générés

```bash
ls -la dist/
```

---

## ☁️ Étape 4: Déploiement Frontend (Vercel)

### 4.1 Installation de Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Login Vercel

```bash
vercel login
```

### 4.3 Configuration du projet

```bash
vercel
```

Suivre les instructions:
- Set up and deploy? **Y**
- Which scope? Sélectionner votre compte
- Link to existing project? **N**
- Project name? **decompression-calculator**
- Directory? **./dist**
- Override settings? **N**

### 4.4 Variables d'environnement Vercel

Dans le dashboard Vercel (https://vercel.com/dashboard):
1. Aller dans Settings > Environment Variables
2. Ajouter:
   - `VITE_API_URL` = URL de votre API backend
   - `VITE_ENCRYPTION_KEY` = Clé de chiffrement (optionnel)

### 4.5 Déploiement en production

```bash
vercel --prod
```

---

## 🖥️ Étape 5: Déploiement Backend (Railway)

### 5.1 Créer un compte Railway

Aller sur https://railway.app et créer un compte

### 5.2 Créer un nouveau projet

1. Cliquer sur "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Connecter votre repository
4. Sélectionner le dossier `server/`

### 5.3 Configuration des variables d'environnement

Dans Railway Dashboard > Variables:
```
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://votre-domaine-vercel.vercel.app
SESSION_SECRET=votre-clé-secrète
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5.4 Configuration du démarrage

Dans Railway Settings > Start Command:
```bash
node server/api.js
```

### 5.5 Déployer

Railway déploiera automatiquement. Récupérer l'URL générée.

---

## 🔗 Étape 6: Connecter Frontend et Backend

### 6.1 Mettre à jour vercel.json

Remplacer l'URL du backend:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://votre-backend-railway.up.railway.app/api/:path*"
    }
  ]
}
```

### 6.2 Redéployer le frontend

```bash
vercel --prod
```

---

## ✅ Étape 7: Tests Post-Déploiement

### 7.1 Tests fonctionnels

- [ ] Accéder à l'application
- [ ] Tester le calculateur de décompression
- [ ] Tester la sauvegarde des informations plongeur
- [ ] Tester les différentes langues (FR/EN)
- [ ] Tester sur mobile

### 7.2 Tests de sécurité

**Vérifier les headers de sécurité:**
```bash
curl -I https://votre-domaine.vercel.app
```

Ou utiliser: https://securityheaders.com

**Tester le rate limiting:**
```bash
for i in {1..15}; do curl https://votre-api.railway.app/api/diver-info; done
```

### 7.3 Tests de performance

Utiliser Google Lighthouse:
1. Ouvrir DevTools (F12)
2. Onglet Lighthouse
3. Générer le rapport

Objectifs:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 📊 Étape 8: Monitoring et Maintenance

### 8.1 Configurer Sentry (optionnel)

```bash
npm install @sentry/vue
```

Dans `src/main.ts`:
```typescript
import * as Sentry from "@sentry/vue";

Sentry.init({
  app,
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

### 8.2 Configurer les alertes

Dans Vercel:
- Settings > Notifications
- Activer les alertes de déploiement

Dans Railway:
- Settings > Notifications
- Configurer les webhooks

### 8.3 Planifier les mises à jour

**Hebdomadaire:**
```bash
npm audit
```

**Mensuel:**
```bash
npm update
npm audit fix
```

**Trimestriel:**
- Révision complète du code de sécurité
- Mise à jour des dépendances majeures
- Tests de pénétration

---

## 🆘 Dépannage

### Problème: CORS errors

**Solution:**
Vérifier que `ALLOWED_ORIGINS` dans Railway contient l'URL Vercel exacte.

### Problème: Rate limiting trop strict

**Solution:**
Augmenter `RATE_LIMIT_MAX_REQUESTS` dans les variables d'environnement.

### Problème: Build fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problème: API ne répond pas

**Solution:**
Vérifier les logs Railway:
```bash
railway logs
```

---

## 📚 Ressources Utiles

- **Vercel Documentation:** https://vercel.com/docs
- **Railway Documentation:** https://docs.railway.app
- **Security Headers:** https://securityheaders.com
- **SSL Test:** https://www.ssllabs.com/ssltest/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

## 🎉 Félicitations!

Votre application est maintenant déployée en production avec les meilleures pratiques de sécurité!

**URLs de production:**
- Frontend: https://votre-domaine.vercel.app
- Backend API: https://votre-backend.railway.app

**Prochaines étapes:**
1. Configurer un nom de domaine personnalisé
2. Mettre en place un système de backup
3. Configurer le monitoring avancé
4. Planifier les mises à jour de sécurité

---

*Guide créé par Bob - Deployment Assistant*