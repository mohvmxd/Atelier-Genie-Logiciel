#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚍 School Transport Management System${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js trouvé ($(node -v))${NC}"

# Check if sudo npm modules are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    sudo npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dépendances installées${NC}"
else
    echo -e "${GREEN}✅ Dépendances trouvées${NC}"
fi

# Verify database connection
echo -e "\n${YELLOW}🔍 Vérification de la base de données...${NC}"
npm run verify
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Voulez-vous insérer des données de test? (y/n)${NC}"
    read -t 10 -r response
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        sudo npm run seed
    fi
fi

# Start the app
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Démarrage du serveur avec nodemon...${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

sudo npm run dev
