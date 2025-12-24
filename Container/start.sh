#!/bin/bash

# Script de démarrage pour l'application Decompression Calculator
# Ce script facilite le démarrage de l'application conteneurisée

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé. Veuillez installer Docker avant de continuer."
        exit 1
    fi
    print_success "Docker est installé"
}

# Vérifier que Docker Compose est installé
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose avant de continuer."
        exit 1
    fi
    print_success "Docker Compose est installé"
}

# Vérifier que Docker est en cours d'exécution
check_docker_running() {
    if ! docker info &> /dev/null; then
        print_error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker."
        exit 1
    fi
    print_success "Docker est en cours d'exécution"
}

# Créer le fichier .env s'il n'existe pas
create_env_file() {
    if [ ! -f .env ]; then
        print_warning "Le fichier .env n'existe pas. Création à partir de .env.example..."
        cp .env.example .env
        print_success "Fichier .env créé. Veuillez le modifier selon vos besoins."
    else
        print_success "Le fichier .env existe déjà"
    fi
}

# Arrêter les conteneurs existants
stop_containers() {
    print_message "Arrêt des conteneurs existants..."
    docker-compose down 2>/dev/null || true
    print_success "Conteneurs arrêtés"
}

# Construire les images
build_images() {
    print_message "Construction des images Docker..."
    if [ "$1" == "--no-cache" ]; then
        docker-compose build --no-cache
    else
        docker-compose build
    fi
    print_success "Images construites avec succès"
}

# Démarrer les conteneurs
start_containers() {
    print_message "Démarrage des conteneurs..."
    docker-compose up -d
    print_success "Conteneurs démarrés"
}

# Afficher les logs
show_logs() {
    print_message "Affichage des logs..."
    docker-compose logs -f
}

# Vérifier l'état des conteneurs
check_status() {
    print_message "Vérification de l'état des conteneurs..."
    sleep 5
    docker-compose ps
    
    # Vérifier si les services sont accessibles
    print_message "Vérification de l'accessibilité des services..."
    
    if curl -s http://localhost:3001/api/diver-info > /dev/null; then
        print_success "Backend accessible sur http://localhost:3001"
    else
        print_warning "Backend non accessible. Vérifiez les logs avec: docker-compose logs backend"
    fi
    
    if curl -s http://localhost > /dev/null; then
        print_success "Frontend accessible sur http://localhost"
    else
        print_warning "Frontend non accessible. Vérifiez les logs avec: docker-compose logs frontend"
    fi
}

# Afficher l'aide
show_help() {
    echo "Usage: ./start.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help              Afficher cette aide"
    echo "  --no-cache          Construire les images sans utiliser le cache"
    echo "  --logs              Afficher les logs après le démarrage"
    echo "  --stop              Arrêter les conteneurs"
    echo "  --restart           Redémarrer les conteneurs"
    echo "  --rebuild           Reconstruire et redémarrer les conteneurs"
    echo ""
    echo "Exemples:"
    echo "  ./start.sh                    # Démarrage normal"
    echo "  ./start.sh --no-cache         # Reconstruction complète"
    echo "  ./start.sh --logs             # Démarrage avec affichage des logs"
    echo "  ./start.sh --stop             # Arrêt des conteneurs"
    echo ""
}

# Script principal
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Decompression Calculator - Démarrage Conteneurisé   ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    # Traiter les arguments
    case "$1" in
        --help)
            show_help
            exit 0
            ;;
        --stop)
            check_docker
            check_docker_compose
            check_docker_running
            stop_containers
            print_success "Application arrêtée"
            exit 0
            ;;
        --restart)
            check_docker
            check_docker_compose
            check_docker_running
            stop_containers
            start_containers
            check_status
            print_success "Application redémarrée"
            exit 0
            ;;
        --rebuild)
            check_docker
            check_docker_compose
            check_docker_running
            stop_containers
            build_images --no-cache
            start_containers
            check_status
            print_success "Application reconstruite et redémarrée"
            exit 0
            ;;
    esac
    
    # Vérifications préalables
    check_docker
    check_docker_compose
    check_docker_running
    create_env_file
    
    # Construction et démarrage
    stop_containers
    
    if [ "$1" == "--no-cache" ]; then
        build_images --no-cache
    else
        build_images
    fi
    
    start_containers
    check_status
    
    echo ""
    print_success "Application démarrée avec succès!"
    echo ""
    echo "  Frontend: http://localhost"
    echo "  Backend:  http://localhost:3001/api"
    echo ""
    echo "Commandes utiles:"
    echo "  docker-compose logs -f          # Voir les logs"
    echo "  docker-compose ps               # Voir l'état des conteneurs"
    echo "  docker-compose down             # Arrêter l'application"
    echo "  docker-compose restart          # Redémarrer l'application"
    echo ""
    
    if [ "$1" == "--logs" ] || [ "$2" == "--logs" ]; then
        show_logs
    fi
}

# Exécuter le script principal
main "$@"

# Made with Bob
