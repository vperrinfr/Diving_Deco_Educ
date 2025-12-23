# Plan d'Implémentation : Comparaison Multi-Modèles de Décompression

## 🎯 Objectif
Permettre la comparaison didactique de 4 modèles de décompression :
- ✅ **Bühlmann ZHL-16C** (déjà implémenté)
- 🆕 **VPM-B** (Varying Permeability Model - Baker)
- 🆕 **RGBM** (Reduced Gradient Bubble Model)
- 🆕 **Tables US Navy** (classiques)

## 📐 Architecture Technique

### 1. Structure des Fichiers

```
src/
├── types/
│   └── decoModels.ts                    # Types pour les modèles
├── utils/
│   ├── buhlmann/                        # Existant
│   ├── vpmb/
│   │   ├── constants.ts                 # Constantes VPM-B
│   │   ├── bubbleModel.ts               # Calculs bulles
│   │   └── decompression.ts             # Algo VPM-B
│   ├── rgbm/
│   │   ├── constants.ts                 # Constantes RGBM
│   │   ├── bubbleGradient.ts            # Calculs gradient
│   │   └── decompression.ts             # Algo RGBM
│   └── tables/
│       ├── usNavyTables.ts              # Tables US Navy
│       └── tableInterpolation.ts        # Interpolation
├── services/
│   └── modelComparisonService.ts        # Service de comparaison
└── components/
    └── comparison/
        ├── ModelSelector.vue            # Sélection modèles
        ├── ComparisonResults.vue        # Résultats côte à côte
        └── ComparisonChart.vue          # Graphique superposé
```

### 2. Types TypeScript (`src/types/decoModels.ts`)

```typescript
export enum DecompressionModel {
  BUHLMANN_ZHL16C = 'buhlmann',
  VPM_B = 'vpmb',
  RGBM = 'rgbm',
  US_NAVY = 'usnavy'
}

export interface ModelProfile {
  model: DecompressionModel;
  profile: DiveProfile;
  characteristics: ModelCharacteristics;
}

export interface ModelCharacteristics {
  name: string;
  description: string;
  conservatism: 'conservative' | 'moderate' | 'liberal';
  bubbleModel: boolean;
  dissolvedGasModel: boolean;
  deepStops: boolean;
}

export interface ComparisonResult {
  profiles: ModelProfile[];
  differences: ModelDifference[];
  recommendations: string[];
}

export interface ModelDifference {
  aspect: 'totalTime' | 'deepStops' | 'shallowStops' | 'firstStop';
  values: Record<DecompressionModel, number>;
  significance: 'major' | 'moderate' | 'minor';
}
```

### 3. Implémentation Simplifiée des Modèles

#### VPM-B (Simplified)
**Principe** : Modèle à bulles avec perméabilité variable
- Favorise les paliers profonds pour limiter la croissance des bulles
- Utilise des "noyaux de bulles" critiques
- Approximation : Bühlmann + ajustement pour paliers profonds (+20% temps profond, -10% temps peu profond)

#### RGBM (Simplified)
**Principe** : Modèle de gradient de bulles réduit
- Combine dissolution des gaz et formation de bulles
- Pénalités pour plongées répétitives et yo-yo
- Approximation : Bühlmann + facteur de gradient réduit (GF 30/70 au lieu de 40/85)

#### Tables US Navy
**Principe** : Tables empiriques basées sur des tests
- Groupes de plongée (A-Z)
- Intervalles de surface
- Plongées répétitives
- Implémentation : Lookup table avec interpolation linéaire

### 4. Service de Comparaison

```typescript
// Pseudo-code
class ModelComparisonService {
  compareModels(
    parameters: DiveParameters,
    models: DecompressionModel[]
  ): ComparisonResult {
    // Calculer chaque modèle
    const profiles = models.map(model => 
      this.calculateWithModel(parameters, model)
    );
    
    // Analyser les différences
    const differences = this.analyzeDifferences(profiles);
    
    // Générer recommandations
    const recommendations = this.generateRecommendations(differences);
    
    return { profiles, differences, recommendations };
  }
}
```

### 5. Interface Utilisateur

#### Vue Côte à Côte (2-3 modèles)
```
┌─────────────────────────────────────────────────────┐
│ Sélection des Modèles                               │
│ [x] Bühlmann  [x] VPM-B  [ ] RGBM  [ ] US Navy     │
└─────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│   Bühlmann ZHL-16C   │       VPM-B          │
├──────────────────────┼──────────────────────┤
│ Temps total: 45 min  │ Temps total: 48 min  │
│ Premier palier: 9m   │ Premier palier: 12m  │
│ Paliers: 3           │ Paliers: 4           │
│                      │                      │
│ Profil:              │ Profil:              │
│ [Graphique]          │ [Graphique]          │
│                      │                      │
│ Paliers:             │ Paliers:             │
│ • 9m - 3 min         │ • 12m - 2 min        │
│ • 6m - 5 min         │ • 9m - 4 min         │
│ • 3m - 3 min         │ • 6m - 6 min         │
│                      │ • 3m - 3 min         │
└──────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Analyse des Différences                             │
│                                                     │
│ 🔵 Paliers profonds: VPM-B ajoute +1 palier à 12m  │
│ ⚠️  Temps total: VPM-B +3 min (+6.7%)              │
│ ℹ️  Conservatisme: VPM-B plus conservateur         │
└─────────────────────────────────────────────────────┘
```

### 6. Caractéristiques Éducatives

#### Explications Intégrées
- **Bühlmann** : "Modèle de gaz dissous, calcule la saturation des tissus"
- **VPM-B** : "Modèle à bulles, privilégie les paliers profonds"
- **RGBM** : "Hybride, combine gaz dissous et bulles"
- **US Navy** : "Tables empiriques, testées sur des plongeurs"

#### Indicateurs Visuels
- 🟢 Conservateur (plus sûr, plus long)
- 🟡 Modéré (équilibré)
- 🔴 Libéral (plus court, moins de marge)

#### Recommandations Contextuelles
- "VPM-B recommandé pour plongées profondes (>30m)"
- "Bühlmann adapté aux plongées récréatives"
- "RGBM pénalise les plongées yo-yo"
- "Tables US Navy : approche conservatrice éprouvée"

## 📊 Métriques de Comparaison

### Différences Clés à Afficher
1. **Temps total de plongée**
2. **Profondeur du premier palier**
3. **Nombre de paliers**
4. **Temps aux paliers profonds (>9m)**
5. **Temps aux paliers peu profonds (≤9m)**
6. **Temps de décompression total**

### Visualisations
1. **Graphique superposé** : Tous les profils sur un même graphique
2. **Tableau comparatif** : Paliers côte à côte
3. **Diagramme en barres** : Temps par profondeur
4. **Indicateurs de différence** : % d'écart entre modèles

## 🎓 Aspects Éducatifs

### Messages Pédagogiques
- "Les modèles à bulles (VPM-B, RGBM) favorisent les paliers profonds"
- "Bühlmann est le standard des ordinateurs de plongée modernes"
- "Les tables US Navy sont très conservatrices"
- "Aucun modèle n'est parfait : tous sont des approximations"

### Cas d'Usage Recommandés
- **Plongée récréative (<30m)** : Bühlmann ou Tables
- **Plongée technique (>30m)** : VPM-B ou RGBM
- **Plongées répétitives** : RGBM (pénalités intégrées)
- **Formation** : Tables US Navy (compréhension des bases)

## 🔄 Flux d'Utilisation

1. **Utilisateur entre les paramètres de plongée**
2. **Sélectionne 2-3 modèles à comparer**
3. **Clique sur "Comparer les modèles"**
4. **Voit les résultats côte à côte**
5. **Analyse les différences avec explications**
6. **Peut exporter la comparaison en PDF**

## 📝 Traductions Nécessaires

### Français
- "Comparaison de modèles"
- "Sélectionnez les modèles à comparer"
- "Modèle à gaz dissous"
- "Modèle à bulles"
- "Paliers profonds"
- "Conservatisme"

### Anglais
- "Model comparison"
- "Select models to compare"
- "Dissolved gas model"
- "Bubble model"
- "Deep stops"
- "Conservatism"

## 🚀 Ordre d'Implémentation

1. ✅ Types et interfaces
2. ✅ VPM-B simplifié
3. ✅ RGBM simplifié
4. ✅ Tables US Navy
5. ✅ Service de comparaison
6. ✅ Composant ModelSelector
7. ✅ Composant ComparisonResults
8. ✅ Composant ComparisonChart
9. ✅ Intégration dans CalculatorPage
10. ✅ Traductions
11. ✅ Export PDF
12. ✅ Documentation éducative

## 📚 Références Scientifiques (Simplifiées)

### VPM-B
- Basé sur les travaux de Yount & Hoffman
- Noyaux de bulles critiques : rayon initial ~0.8 μm
- Perméabilité variable selon la profondeur

### RGBM
- Développé par Bruce Wienke
- Facteur de gradient réduit : limite la supersaturation
- Pénalités pour profils à risque

### US Navy Tables
- Révision 6 (2008)
- Groupes de plongée A-Z
- Basées sur des tests empiriques depuis les années 1950

## ⚠️ Limitations et Avertissements

**À afficher clairement :**
- "Ces modèles sont des approximations simplifiées à but éducatif"
- "Pour des plongées réelles, utilisez un ordinateur de plongée certifié"
- "Consultez toujours les tables officielles pour la planification"
- "Aucun modèle ne garantit l'absence d'accident de décompression"

## 🎯 Résultat Attendu

Une interface permettant de :
1. Comparer visuellement 2-3 modèles simultanément
2. Comprendre les différences conceptuelles
3. Voir l'impact sur les paliers de décompression
4. Apprendre les forces/faiblesses de chaque approche
5. Faire des choix éclairés pour la planification de plongée

---

**Temps estimé d'implémentation** : 1-2 jours
**Complexité** : Moyenne (simplifications didactiques)
**Valeur éducative** : Très élevée 🎓