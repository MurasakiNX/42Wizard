#!/bin/bash

# Creates the autostart directory if it doesn't exist.
mkdir -p "$HOME/.config/autostart"

# Creates the desktop file to autostart the script.
cat <<EOL > "$HOME/.config/autostart/ft_wizard.desktop"
[Desktop Entry]
Type=Application
Exec=$HOME/.42Wizard/script.sh
Name=42Wizard
Comment=42 Wizard Startup Script
EOL

echo "ft_wizard.desktop has been created at $HOME/.config/autostart/, don't forget to relog to run the script automatically."
