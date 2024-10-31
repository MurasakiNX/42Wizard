#!/bin/bash

# Fonction pour envoyer des notifications
notify() {
    local msg=$1
    notify-send "42Wizard" "$msg"
}

# Récupération du userKey depuis le fichier dans $HOME/.42
user_key_file="$HOME/.42Wizard/userKey"
if [[ ! -f "$user_key_file" ]]; then
    notify "Erreur : Le fichier userKey est introuvable dans $HOME/.42Wizard."
    exit 1
fi
user_key=$(cat "$user_key_file")
notify "script.sh lancé normalement"

# Fonction pour envoyer une requête HTTP avec le statut et le userKey
send_http_request() {
    local status=$1
    curl -X POST -H "Content-Type: application/json" \
        -d "{\"status\": \"$status\", \"userKey\": \"$user_key\"}" https://shogun-raiden.com/42Wizard
    echo
}

# Définir l'état initial en fonction de la présence de ft_lock
if ps aux | grep -v grep | grep -q "ft_lock"; then
    current_state="locked"
else
    current_state="unlocked"
fi

# Boucle de surveillance du processus ft_lock
while true; do
    if ps aux | grep -v grep | grep -q "ft_lock"; then
        if [[ "$current_state" != "locked" ]]; then
            echo "État verrouillé détecté, envoi de la requête HTTP"
            echo
            send_http_request "locked"
            current_state="locked"
        fi
    else
        if [[ "$current_state" == "locked" ]]; then
            echo "État déverrouillé détecté, envoi de la requête HTTP"
            echo
            send_http_request "unlocked"
            current_state="unlocked"
        fi
    fi
    sleep 0.42
done
