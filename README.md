# 🤿 Decompression Calculator

Une application web moderne de calcul de profils de décompression pour la plongée sous-marine, basée sur l'algorithme Bühlmann ZHL-16C avec facteurs de gradient.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)

## ⚠️ Avertissement Important

**Cette application est destinée à des fins éducatives uniquement.** 

- Ne jamais utiliser cette application pour planifier de vraies plongées
- Toujours utiliser des ordinateurs de plongée certifiés
- Suivre les procédures de planification de plongée appropriées
- Ne jamais plonger au-delà de votre niveau de formation et de certification

## 🌟 Fonctionnalités

### Calculs de Décompression
- **Plongées simples** : Calcul de profils pour des plongées à un seul niveau
- **Plongées multi-niveaux** : Support des plongées avec plusieurs segments de profondeur
- **Multi-gaz** : Gestion de plusieurs mélanges gazeux (Air, Nitrox, Trimix)
- **Algorithme Bühlmann ZHL-16C** : Implémentation complète avec 16 compartiments tissulaires
- **Facteurs de gradient** : Personnalisation des facteurs de gradient (GF Low/High)

### Visualisations
- **Graphique de profil** : Visualisation interactive du profil de plongée
- **Paliers de décompression** : Affichage détaillé de tous les paliers requis
- **Temps de plongée** : Calcul du temps total, temps de fond, et temps de décompression
- **Limite sans décompression (NDL)** : Calcul automatique pour les plongées simples

### Gestion des Gaz
- **Mélanges personnalisés** : Configuration de l'oxygène, azote et hélium
- **Profondeur maximale d'utilisation (MOD)** : Calcul automatique basé sur la PpO2
- **Changements de gaz** : Support des changements de gaz pendant la remontée
- **Validation de sécurité** : Vérification de la toxicité de l'oxygène et de la narcose

### Interface Utilisateur
- **Design moderne** : Interface basée sur Carbon Design System d'IBM
- **Responsive** : Optimisé pour desktop, tablette et mobile
- **Thème sombre** : Interface élégante avec thème sombre
- **Avertissements** : Système d'alertes pour les conditions dangereuses

## 🚀 Installation

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone <repository-url>
cd decompression-calculator
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
```
http://localhost:5173
```

## 📦 Scripts Disponibles

```bash
# Démarrer le serveur de développement
npm run dev

# Compiler pour la production
npm run build

# Prévisualiser la version de production
npm run preview
```

## 🏗️ Architecture Technique

### Stack Technologique
- **Framework** : Vue 3 avec Composition API
- **Langage** : TypeScript
- **Build Tool** : Vite
- **UI Framework** : Carbon Design System
- **Charts** : Chart.js avec vue-chartjs
- **State Management** : Pinia (prêt à l'emploi)
- **Styling** : Tailwind CSS + Carbon Styles

### Structure du Projet
```
decompression-calculator/
├── src/
│   ├── components/
│   │   ├── calculator/          # Composants de calcul
│   │   │   ├── DiveCalculatorInput.vue
│   │   │   ├── DiveProfileResults.vue
│   │   │   ├── GasManager.vue
│   │   │   ├── SegmentManager.vue
│   │   │   └── RateConfiguration.vue
│   │   ├── common/              # Composants communs
│   │   │   └── WarningsDisplay.vue
│   │   └── visualizations/      # Visualisations
│   │       └── DiveProfileChart.vue
│   ├── utils/
│   │   ├── buhlmann/            # Algorithme Bühlmann
│   │   │   ├── constants.ts     # Constantes ZHL-16C
│   │   │   ├── decompression.ts # Calculs de décompression
│   │   │   ├── gradientFactors.ts
│   │   │   └── tissueLoading.ts # Chargement des tissus
│   │   ├── conversions.ts       # Conversions d'unités
│   │   └── gasMix.ts           # Calculs de mélanges gazeux
│   ├── types/
│   │   └── index.ts            # Définitions TypeScript
│   ├── App.vue                 # Composant principal
│   └── main.ts                 # Point d'entrée
├── public/                     # Fichiers statiques
└── index.html                  # HTML principal
```

## 🧮 Algorithme Bühlmann ZHL-16C

### Principes de Base
L'algorithme Bühlmann ZHL-16C modélise l'absorption et l'élimination des gaz inertes dans 16 compartiments tissulaires différents, chacun avec des demi-temps spécifiques :

- **Compartiments rapides** : 4 à 12.5 minutes (tissus bien perfusés)
- **Compartiments lents** : 18.5 à 635 minutes (tissus peu perfusés)

### Facteurs de Gradient
Les facteurs de gradient permettent d'ajuster la conservativité du profil :

- **GF Low** : Appliqué au premier palier (ex: 30%)
- **GF High** : Appliqué en surface (ex: 70%)
- **Interpolation linéaire** : Entre les deux valeurs

### Équations Utilisées

**Équation de Schreiner** (profondeur constante) :
```
P_tissue = P_inspired + (P_initial - P_inspired) × e^(-k×t)
```

**Équation de Haldane** (changement de profondeur) :
```
P_tissue = P_i0 + R × (t - 1/k) - (P_i0 - P_initial - R/k) × e^(-k×t)
```

**M-Value** (pression ambiante tolérée) :
```
M-value = a + (P_ambient / b)
```

## 📊 Paramètres de Plongée

### Plongée Simple
- **Profondeur** : 0-100 mètres
- **Temps de fond** : 1-999 minutes
- **Mélange gazeux** : Air, Nitrox, ou Trimix personnalisé
- **Facteurs de gradient** : GF Low (10-90%), GF High (50-100%)

### Plongée Multi-Niveaux
- **Segments multiples** : Jusqu'à 10 segments
- **Gaz multiples** : Jusqu'à 5 mélanges différents
- **Profondeur par segment** : 0-100 mètres
- **Durée par segment** : 1-999 minutes

### Taux de Descente/Remontée
- **Descente** : 20 m/min (configurable)
- **Remontée** : 10 m/min (configurable)
- **Palier de sécurité** : 3 minutes à 5 mètres (automatique si applicable)

## 🔬 Calculs Effectués

### Pour Chaque Plongée
1. **Chargement des tissus** : Calcul de la saturation en azote et hélium
2. **Plafond de décompression** : Profondeur minimale sûre pour chaque tissu
3. **Paliers requis** : Profondeur et durée de chaque palier
4. **Temps total** : Descente + fond + décompression + remontée
5. **NDL** : Limite sans décompression (plongées simples)
6. **Avertissements** : Toxicité O2, narcose, décompression excessive

### Validations de Sécurité
- **PpO2** : Vérification de la pression partielle d'oxygène (< 1.4 bar en fond, < 1.6 bar en déco)
- **Narcose** : Calcul de la profondeur équivalente narcotique (END)
- **Temps de décompression** : Alerte si > 50% du temps total
- **Profondeur maximale** : Vérification du MOD pour chaque gaz

## 🎨 Interface Utilisateur

### Sections Principales
1. **Panneau de saisie** : Configuration des paramètres de plongée
2. **Résultats** : Affichage du profil calculé
3. **Graphique** : Visualisation du profil de plongée
4. **Avertissements** : Alertes de sécurité
5. **Informations** : Détails sur l'algorithme utilisé

### Thème et Design
- **Carbon Design System** : Composants IBM Carbon
- **Thème sombre** : Interface élégante et moderne
- **Responsive** : Adapté à tous les écrans
- **Accessibilité** : Conforme aux standards WCAG

## 🧪 Exemples d'Utilisation

### Plongée Simple à l'Air
```
Profondeur : 30 mètres
Temps : 25 minutes
Gaz : Air (21% O2)
GF : 30/70
```

### Plongée Nitrox
```
Profondeur : 25 mètres
Temps : 40 minutes
Gaz : Nitrox 32 (32% O2)
GF : 40/80
```

### Plongée Multi-Niveaux
```
Segment 1 : 40m pendant 15 min (Trimix 18/45)
Segment 2 : 30m pendant 20 min (Trimix 18/45)
Segment 3 : 20m pendant 15 min (Nitrox 50)
GF : 30/70
```

## 📚 Ressources et Références

### Documentation Technique
- [Bühlmann Decompression Algorithm](https://en.wikipedia.org/wiki/B%C3%BChlmann_decompression_algorithm)
- [Gradient Factors](https://www.shearwater.com/products/perdix-ai/gradient-factors/)
- [ZHL-16C Parameters](https://www.divingphysics.com/buhlmann-zhl-16c/)

### Standards de Plongée
- PADI - Professional Association of Diving Instructors
- SSI - Scuba Schools International
- TDI - Technical Diving International

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Soumettre des pull requests

## 📄 Licence

Ce projet est à des fins éducatives. Consultez le fichier LICENSE pour plus de détails.

## 👨‍💻 Développement

### Technologies Utilisées
- Vue 3 avec `<script setup>` et Composition API
- TypeScript pour la sécurité des types
- Vite pour un build ultra-rapide
- Carbon Design System pour l'UI
- Chart.js pour les visualisations

### Bonnes Pratiques
- Code TypeScript strict
- Composants réutilisables
- Séparation des préoccupations
- Tests unitaires (à venir)
- Documentation inline

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement

---

**Rappel** : Cette application est uniquement à des fins éducatives. Ne jamais l'utiliser pour planifier de vraies plongées. Toujours utiliser des équipements certifiés et suivre une formation appropriée.


---

# 🤿 Decompression Calculator (English Version)

A modern web application for calculating decompression dive profiles, based on the Bühlmann ZHL-16C algorithm with gradient factors.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)

## ⚠️ Important Warning

**This application is for educational purposes only.** 

- Never use this application to plan real dives
- Always use certified dive computers
- Follow proper dive planning procedures
- Never dive beyond your training and certification level

## 🌟 Features

### Decompression Calculations
- **Simple dives**: Profile calculation for single-level dives
- **Multi-level dives**: Support for dives with multiple depth segments
- **Multi-gas**: Management of multiple gas mixes (Air, Nitrox, Trimix)
- **Bühlmann ZHL-16C Algorithm**: Complete implementation with 16 tissue compartments
- **Gradient factors**: Customizable gradient factors (GF Low/High)

### Visualizations
- **Profile chart**: Interactive dive profile visualization
- **Decompression stops**: Detailed display of all required stops
- **Dive times**: Calculation of total time, bottom time, and decompression time
- **No-decompression limit (NDL)**: Automatic calculation for simple dives

### Gas Management
- **Custom mixes**: Configuration of oxygen, nitrogen, and helium
- **Maximum operating depth (MOD)**: Automatic calculation based on PpO2
- **Gas switches**: Support for gas changes during ascent
- **Safety validation**: Oxygen toxicity and narcosis verification

### User Interface
- **Modern design**: Interface based on IBM's Carbon Design System
- **Responsive**: Optimized for desktop, tablet, and mobile
- **Dark theme**: Elegant interface with dark theme
- **Warnings**: Alert system for dangerous conditions

## 🚀 Installation

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd decompression-calculator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

## 📦 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Technical Architecture

### Technology Stack
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: Carbon Design System
- **Charts**: Chart.js with vue-chartjs
- **State Management**: Pinia (ready to use)
- **Styling**: Tailwind CSS + Carbon Styles

### Project Structure
```
decompression-calculator/
├── src/
│   ├── components/
│   │   ├── calculator/          # Calculator components
│   │   │   ├── DiveCalculatorInput.vue
│   │   │   ├── DiveProfileResults.vue
│   │   │   ├── GasManager.vue
│   │   │   ├── SegmentManager.vue
│   │   │   └── RateConfiguration.vue
│   │   ├── common/              # Common components
│   │   │   └── WarningsDisplay.vue
│   │   └── visualizations/      # Visualizations
│   │       └── DiveProfileChart.vue
│   ├── utils/
│   │   ├── buhlmann/            # Bühlmann algorithm
│   │   │   ├── constants.ts     # ZHL-16C constants
│   │   │   ├── decompression.ts # Decompression calculations
│   │   │   ├── gradientFactors.ts
│   │   │   └── tissueLoading.ts # Tissue loading
│   │   ├── conversions.ts       # Unit conversions
│   │   └── gasMix.ts           # Gas mix calculations
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.vue                 # Main component
│   └── main.ts                 # Entry point
├── public/                     # Static files
└── index.html                  # Main HTML
```

## 🧮 Bühlmann ZHL-16C Algorithm

### Basic Principles
The Bühlmann ZHL-16C algorithm models the absorption and elimination of inert gases in 16 different tissue compartments, each with specific half-times:

- **Fast compartments**: 4 to 12.5 minutes (well-perfused tissues)
- **Slow compartments**: 18.5 to 635 minutes (poorly-perfused tissues)

### Gradient Factors
Gradient factors allow adjusting the conservatism of the profile:

- **GF Low**: Applied at first stop (e.g., 30%)
- **GF High**: Applied at surface (e.g., 70%)
- **Linear interpolation**: Between the two values

### Equations Used

**Schreiner Equation** (constant depth):
```
P_tissue = P_inspired + (P_initial - P_inspired) × e^(-k×t)
```

**Haldane Equation** (depth change):
```
P_tissue = P_i0 + R × (t - 1/k) - (P_i0 - P_initial - R/k) × e^(-k×t)
```

**M-Value** (tolerated ambient pressure):
```
M-value = a + (P_ambient / b)
```

## 📊 Dive Parameters

### Simple Dive
- **Depth**: 0-100 meters
- **Bottom time**: 1-999 minutes
- **Gas mix**: Air, Nitrox, or custom Trimix
- **Gradient factors**: GF Low (10-90%), GF High (50-100%)

### Multi-Level Dive
- **Multiple segments**: Up to 10 segments
- **Multiple gases**: Up to 5 different mixes
- **Depth per segment**: 0-100 meters
- **Duration per segment**: 1-999 minutes

### Descent/Ascent Rates
- **Descent**: 20 m/min (configurable)
- **Ascent**: 10 m/min (configurable)
- **Safety stop**: 3 minutes at 5 meters (automatic when applicable)

## 🔬 Calculations Performed

### For Each Dive
1. **Tissue loading**: Calculation of nitrogen and helium saturation
2. **Decompression ceiling**: Minimum safe depth for each tissue
3. **Required stops**: Depth and duration of each stop
4. **Total time**: Descent + bottom + decompression + ascent
5. **NDL**: No-decompression limit (simple dives)
6. **Warnings**: O2 toxicity, narcosis, excessive decompression

### Safety Validations
- **PpO2**: Oxygen partial pressure verification (< 1.4 bar at depth, < 1.6 bar during deco)
- **Narcosis**: Equivalent narcotic depth (END) calculation
- **Decompression time**: Alert if > 50% of total time
- **Maximum depth**: MOD verification for each gas

## 🎨 User Interface

### Main Sections
1. **Input panel**: Dive parameter configuration
2. **Results**: Calculated profile display
3. **Chart**: Dive profile visualization
4. **Warnings**: Safety alerts
5. **Information**: Details about the algorithm used

### Theme and Design
- **Carbon Design System**: IBM Carbon components
- **Dark theme**: Elegant and modern interface
- **Responsive**: Adapted to all screens
- **Accessibility**: WCAG standards compliant

## 🧪 Usage Examples

### Simple Air Dive
```
Depth: 30 meters
Time: 25 minutes
Gas: Air (21% O2)
GF: 30/70
```

### Nitrox Dive
```
Depth: 25 meters
Time: 40 minutes
Gas: Nitrox 32 (32% O2)
GF: 40/80
```

### Multi-Level Dive
```
Segment 1: 40m for 15 min (Trimix 18/45)
Segment 2: 30m for 20 min (Trimix 18/45)
Segment 3: 20m for 15 min (Nitrox 50)
GF: 30/70
```

## 📚 Resources and References

### Technical Documentation
- [Bühlmann Decompression Algorithm](https://en.wikipedia.org/wiki/B%C3%BChlmann_decompression_algorithm)
- [Gradient Factors](https://www.shearwater.com/products/perdix-ai/gradient-factors/)
- [ZHL-16C Parameters](https://www.divingphysics.com/buhlmann-zhl-16c/)

### Diving Standards
- PADI - Professional Association of Diving Instructors
- SSI - Scuba Schools International
- TDI - Technical Diving International

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Propose new features
- Improve documentation
- Submit pull requests

## 📄 License

This project is for educational purposes. See the LICENSE file for more details.

## 👨‍💻 Development

### Technologies Used
- Vue 3 with `<script setup>` and Composition API
- TypeScript for type safety
- Vite for ultra-fast builds
- Carbon Design System for UI
- Chart.js for visualizations

### Best Practices
- Strict TypeScript code
- Reusable components
- Separation of concerns
- Unit tests (coming soon)
- Inline documentation

## 📞 Support

For any questions or issues:
- Open an issue on GitHub
- Consult the documentation
- Contact the development team

---

**Reminder**: This application is for educational purposes only. Never use it to plan real dives. Always use certified equipment and follow proper training.
