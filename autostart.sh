#!/bin/bash

# Crée le dossier ~/.config/autostart s'il n'existe pas déjà
mkdir -p "$HOME/.config/autostart"

# Crée le fichier 42Wizard.desktop avec le contenu souhaité
cat <<EOL > "$HOME/.config/autostart/ft_wizard.desktop"
[Desktop Entry]
Type=Application
Exec=$HOME/.42Wizard/script.sh
Name=42 Wizard
Comment=Script de démarrage automatique pour 42 Wizardaaaa
EOL

echo "Le fichier 42Wizard.desktop a été créé dans ~/.config/autostart/"
