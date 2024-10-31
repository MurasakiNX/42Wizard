#!/bin/bash

# Sends notifications to the desktop.
notify() {
    local msg=$1
    notify-send "42Wizard" "$msg"
}

# Fetches userKey at ~/.42Wizard/userKey
user_key_file="$HOME/.42Wizard/userKey"
if [[ ! -f "$user_key_file" ]]; then
    notify "[ERROR]: Cannot fetch userKey at $HOME/.42Wizard"
    exit 1
fi
user_key=$(cat "$user_key_file")
notify "[STARTED UP]: 42Wizard loaded successfully!"

# Sends your status to the API (and authenticates it with your userKey).
send_http_request() {
    local status=$1
    curl -X POST -H "Content-Type: application/json" \
        -d "{\"status\": \"$status\", \"userKey\": \"$user_key\"}" https://shogun-raiden.com/42Wizard
}

# At startup, you are unlocked.
current_state="unlocked"

# Checks every 0.42 second whether your status changed or not.
while true; do
    if ps aux | grep -v grep | grep -q "ft_lock"; then
        if [[ "$current_state" != "locked" ]]; then
            send_http_request "locked"
            current_state="locked"
        fi
    else
        if [[ "$current_state" == "locked" ]]; then
            send_http_request "unlocked"
            current_state="unlocked"
        fi
    fi
    sleep 0.42
done
