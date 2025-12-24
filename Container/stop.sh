#!/bin/bash

# Script d'arrêt pour l'application Decompression Calculator

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

show_help() {
    echo "Usage: ./stop.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help              Afficher cette aide"
    echo "  --remove-volumes    Arrêter et supprimer les volumes (⚠️  supprime les données)"
    echo "  --remove-all        Arrêter et supprimer conteneurs, volumes et images"
    echo ""
    echo "Exemples:"
    echo "  ./stop.sh                      # Arrêt simple"
    echo "  ./stop.sh --remove-volumes     # Arrêt avec suppression des volumes"
    echo "  ./stop.sh --remove-all         # Nettoyage complet"
    echo ""
}

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Decompression Calculator - Arrêt de l'Application   ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    case "$1" in
        --help)
            show_help
            exit 0
            ;;
        --remove-volumes)
            print_warning "Arrêt et suppression des volumes (les données seront perdues)..."
            read -p "Êtes-vous sûr ? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose down -v
                print_success "Conteneurs et volumes supprimés"
            else
                print_message "Opération annulée"
            fi
            ;;
        --remove-all)
            print_warning "Nettoyage complet (conteneurs, volumes et images)..."
            read -p "Êtes-vous sûr ? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose down -v --rmi all
                print_success "Nettoyage complet effectué"
            else
                print_message "Opération annulée"
            fi
            ;;
        *)
            print_message "Arrêt des conteneurs..."
            docker-compose down
            print_success "Conteneurs arrêtés"
            ;;
    esac
    
    echo ""
    print_success "Opération terminée"
    echo ""
}

main "$@"

# Made with Bob
