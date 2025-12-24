# Guide d'Analyse des Paliers de Décompression

## 📋 Table des Matières
1. [Introduction](#introduction)
2. [Concepts Fondamentaux](#concepts-fondamentaux)
3. [Analyse des Compartiments Tissulaires](#analyse-des-compartiments-tissulaires)
4. [Marges de Sécurité](#marges-de-sécurité)
5. [Optimisation des Paliers](#optimisation-des-paliers)
6. [Interprétation des Résultats](#interprétation-des-résultats)
7. [Cas Pratiques](#cas-pratiques)

---

## Introduction

L'analyse des paliers de décompression est un outil essentiel pour comprendre et optimiser votre profil de plongée. Cette fonctionnalité vous permet d'examiner en détail comment l'azote se charge et se décharge dans vos tissus pendant la plongée et la remontée.

### Pourquoi analyser les paliers ?

- **Sécurité** : Comprendre les marges de sécurité à chaque profondeur
- **Optimisation** : Identifier les opportunités d'amélioration du profil
- **Éducation** : Apprendre comment fonctionnent les modèles de décompression
- **Planification** : Prendre des décisions éclairées sur les durées de paliers

---

## Concepts Fondamentaux

### Les Compartiments Tissulaires

Le modèle de Bühlmann divise le corps en **16 compartiments théoriques**, chacun représentant des tissus avec des vitesses de saturation différentes :

| Compartiment | Période (min) | Type de Tissu | Vitesse de Saturation |
|--------------|---------------|---------------|----------------------|
| 1-4 | 4-12.5 | Sang, système nerveux | Très rapide |
| 5-8 | 18.5-38.3 | Muscles, organes | Rapide |
| 9-12 | 54.3-109 | Tissus moyens | Moyenne |
| 13-16 | 146-635 | Tissus lents, os | Lente |

### Pression Partielle d'Azote

À chaque profondeur, vos tissus absorbent l'azote selon la loi de Henry :

```
PN₂ = (Pression ambiante - Pression vapeur eau) × Fraction N₂
```

**Exemple à 30m :**
- Pression ambiante : 4 bars
- Fraction N₂ dans l'air : 0.79
- PN₂ inspirée : (4 - 0.0627) × 0.79 ≈ 3.11 bars

### Gradient Factors (Facteurs de Gradient)

Les GF modulent la limite de sursaturation tolérée :

- **GF Low** : Appliqué au premier palier (ex: 30%)
- **GF High** : Appliqué en surface (ex: 85%)

**Formule :**
```
Limite tolérée = M-value × GF
```

---

## Analyse des Compartiments Tissulaires

### Lecture du Graphique de Saturation

Le graphique montre pour chaque compartiment :

1. **Barre bleue** : Pression actuelle d'azote dans le tissu
2. **Ligne rouge** : Limite de sursaturation (M-value)
3. **Ligne orange** : Limite avec GF appliqué
4. **Pourcentage** : Niveau de saturation par rapport à la limite

#### Interprétation des Couleurs

| Couleur | Saturation | Signification |
|---------|------------|---------------|
| 🟢 Vert | < 70% | Sécurité optimale |
| 🟡 Jaune | 70-85% | Attention requise |
| 🟠 Orange | 85-95% | Zone critique |
| 🔴 Rouge | > 95% | Danger imminent |

### Compartiment Directeur

Le **compartiment directeur** est celui qui contraint le plus la remontée :
- C'est le compartiment le plus proche de sa limite
- Il détermine la profondeur et durée des paliers
- Il peut changer pendant la remontée

**Exemple :**
```
À 30m : Compartiment 5 (18.5 min) est directeur
À 9m  : Compartiment 8 (38.3 min) devient directeur
À 3m  : Compartiment 10 (77 min) prend le relais
```

---

## Marges de Sécurité

### Calcul des Marges

Pour chaque profondeur de palier, nous calculons :

```
Marge (%) = ((M-value × GF) - PN₂ actuelle) / (M-value × GF) × 100
```

### Interprétation des Marges

| Marge | Évaluation | Action Recommandée |
|-------|------------|-------------------|
| > 30% | Excellente | Profil très conservateur |
| 20-30% | Bonne | Profil sûr et efficace |
| 10-20% | Acceptable | Surveiller l'évolution |
| 5-10% | Limite | Envisager palier plus long |
| < 5% | Critique | Prolonger impérativement |

### Facteurs Affectant les Marges

1. **Gradient Factors** : GF plus bas = marges plus grandes
2. **Vitesse de remontée** : Plus lente = meilleures marges
3. **Durée des paliers** : Plus longs = marges accrues
4. **Profil de plongée** : Multi-niveaux vs carré

---

## Optimisation des Paliers

### Stratégies d'Optimisation

#### 1. Ajustement de la Durée

**Palier trop court :**
```
Symptômes :
- Marge < 10% à la fin du palier
- Compartiment directeur > 90% saturé
- Plusieurs compartiments en zone orange

Solution :
- Ajouter 1-2 minutes au palier
- Vérifier l'amélioration des marges
```

**Palier trop long :**
```
Symptômes :
- Marge > 40% pendant tout le palier
- Tous compartiments en zone verte
- Temps total excessif

Solution :
- Réduire de 1 minute
- Maintenir marge > 20%
```

#### 2. Ajustement de la Profondeur

**Palier trop profond :**
- Les tissus lents continuent à se charger
- Efficacité de dégazage réduite
- Temps total augmenté

**Palier trop superficiel :**
- Gradient trop important
- Risque de bulles
- Marges de sécurité réduites

#### 3. Paliers Profonds (Deep Stops)

**Avantages :**
- Protègent les tissus rapides
- Réduisent la formation de bulles initiale
- Confort physiologique

**Inconvénients :**
- Chargent les tissus lents
- Peuvent augmenter le temps total
- Débat scientifique en cours

**Recommandation :**
```
Palier profond optionnel si :
- Plongée > 40m
- Durée > 30 min
- GF Low < 40%

Profondeur : 50% de la profondeur max
Durée : 2-3 minutes
```

---

## Interprétation des Résultats

### Tableau de Saturation

Le tableau détaillé montre pour chaque compartiment :

```
┌─────────────┬──────────┬──────────┬─────────┬────────┐
│ Compartiment│ Période  │ PN₂ (bar)│ Limite  │ Marge  │
├─────────────┼──────────┼──────────┼─────────┼────────┤
│ 1           │ 4.0 min  │ 1.23     │ 2.45    │ 49.8%  │
│ 2           │ 8.0 min  │ 1.67     │ 2.89    │ 42.2%  │
│ 3           │ 12.5 min │ 1.89     │ 3.12    │ 39.4%  │
│ ...         │ ...      │ ...      │ ...     │ ...    │
│ 8 (*)       │ 38.3 min │ 2.34     │ 2.67    │ 12.4%  │ ← Directeur
│ ...         │ ...      │ ...      │ ...     │ ...    │
└─────────────┴──────────┴──────────┴─────────┴────────┘

(*) = Compartiment directeur
```

### Graphique d'Évolution

Le graphique temporel montre :

1. **Phase de plongée** : Charge progressive des tissus
2. **Phase de remontée** : Dégazage contrôlé
3. **Paliers** : Plateaux de stabilisation
4. **Surface** : Désaturation résiduelle

**Points d'attention :**
- Pics de saturation pendant la plongée
- Pentes de dégazage pendant les paliers
- Convergence vers l'équilibre en surface

---

## Cas Pratiques

### Cas 1 : Plongée Carrée Simple

**Profil :**
- Profondeur : 30m
- Durée : 25 minutes
- Gaz : Air
- GF : 30/85

**Analyse :**
```
Palier à 3m - 5 minutes :
- Compartiment directeur : #8 (38.3 min)
- Saturation : 87%
- Marge : 15%
- Évaluation : Acceptable mais limite

Recommandation :
→ Ajouter 2 minutes au palier
→ Nouvelle marge : 23% ✓
```

### Cas 2 : Plongée Multi-Niveaux

**Profil :**
- 40m pendant 10 min
- 25m pendant 15 min
- 15m pendant 10 min

**Analyse :**
```
Palier à 6m - 3 minutes :
- Compartiment directeur : #6 (27 min)
- Saturation : 82%
- Marge : 21%
- Évaluation : Bonne

Palier à 3m - 8 minutes :
- Compartiment directeur : #9 (54.3 min)
- Saturation : 79%
- Marge : 25%
- Évaluation : Très bonne

Conclusion : Profil bien optimisé ✓
```

### Cas 3 : Plongée Nitrox

**Profil :**
- Profondeur : 30m
- Durée : 30 minutes
- Gaz : Nitrox 32%
- GF : 30/85

**Avantages observés :**
```
Comparaison Air vs Nitrox 32% :

Air :
- Palier 3m : 12 minutes
- Marge finale : 18%
- Compartiment directeur : #8

Nitrox 32% :
- Palier 3m : 7 minutes
- Marge finale : 22%
- Compartiment directeur : #9

Gain : 5 minutes, marge +4% ✓
```

---

## Conseils Pratiques

### Avant la Plongée

1. **Planification** :
   - Simulez plusieurs profils
   - Comparez les marges de sécurité
   - Identifiez les compartiments critiques

2. **Configuration** :
   - Choisissez des GF conservateurs (30/85 ou 30/80)
   - Prévoyez du temps supplémentaire
   - Ayez un plan B

### Pendant la Plongée

1. **Surveillance** :
   - Respectez le profil planifié
   - Évitez les yo-yo
   - Contrôlez la vitesse de remontée

2. **Adaptation** :
   - Si vous restez plus profond : ajoutez du temps
   - Si vous remontez plus tôt : recalculez
   - En cas de doute : soyez conservateur

### Après la Plongée

1. **Analyse** :
   - Examinez les marges obtenues
   - Identifiez les points d'amélioration
   - Notez les écarts au plan

2. **Apprentissage** :
   - Comprenez pourquoi certains paliers étaient nécessaires
   - Observez l'évolution des compartiments
   - Affinez vos futures planifications

---

## Limitations et Précautions

### Limitations du Modèle

⚠️ **Important** : Les modèles de décompression sont des approximations

- Variabilité individuelle importante
- Conditions physiologiques non prises en compte
- Facteurs environnementaux ignorés

### Facteurs de Risque Additionnels

Augmentez vos marges de sécurité si :

- ❄️ Eau froide (< 15°C)
- 💪 Effort physique important
- 🏃 Plongées répétitives
- 🎂 Âge > 50 ans
- 🏋️ Surpoids
- 🚬 Tabagisme
- 🍺 Déshydratation
- 🌊 Courant fort
- 🥶 Fatigue

**Recommandation :** Utilisez des GF plus conservateurs (ex: 20/75)

### Situations Spéciales

#### Plongée en Altitude
```
Ajustements nécessaires :
- Pression atmosphérique réduite
- M-values ajustées
- Paliers plus longs
- Marges augmentées
```

#### Plongée Successive
```
Considérations :
- Azote résiduel des plongées précédentes
- Compartiments lents encore chargés
- Temps de surface insuffisant
- Risque cumulatif accru
```

---

## Glossaire

**Compartiment Tissulaire** : Modèle théorique représentant un type de tissu avec une vitesse de saturation spécifique.

**M-value** : Pression maximale d'azote tolérée dans un compartiment à une profondeur donnée.

**Gradient Factor (GF)** : Pourcentage de la M-value utilisé comme limite de sécurité.

**Compartiment Directeur** : Compartiment le plus proche de sa limite, qui contraint la remontée.

**Saturation** : Pourcentage de charge en azote par rapport à la limite tolérée.

**Marge de Sécurité** : Différence entre la charge actuelle et la limite tolérée.

**Période (Half-time)** : Temps nécessaire pour qu'un compartiment atteigne 50% de saturation.

**Sursaturation** : État où la pression d'azote tissulaire dépasse la pression ambiante.

---

## Ressources Complémentaires

### Documentation Technique

- [Bühlmann Algorithm Implementation Guide](./buhlmann-algorithm-implementation-guide.md)
- [Decompression Models Comparison](./DECOMPRESSION_MODELS_COMPARISON_PLAN.md)
- [Architecture Documentation](./decompression-calculator-architecture.md)

### Références Scientifiques

1. Bühlmann, A.A. (1984). "Decompression-Decompression Sickness"
2. Baker, E.C. (1998). "Understanding M-values"
3. Wienke, B.R. (2003). "Reduced Gradient Bubble Model"

### Formation Continue

- Cours de plongée technique
- Séminaires sur la décompression
- Ateliers de planification de plongée
- Communautés de plongeurs techniques

---

## Support et Contact

Pour toute question sur l'analyse des paliers :

- 📧 Email : support@decompression-calculator.com
- 💬 Forum : community.decompression-calculator.com
- 📚 Documentation : docs.decompression-calculator.com

---

**⚠️ Avertissement Final**

Cette analyse est un outil éducatif et de planification. Elle ne remplace pas :
- Une formation appropriée en plongée
- Le jugement d'un plongeur qualifié
- Les procédures de sécurité établies
- Un ordinateur de plongée certifié

**Plongez en sécurité, plongez informé !** 🤿