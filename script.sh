#!/bin/bash

# Sends notifications to the desktop.
notify() {
    local msg=$1
    notify-send "42Wizard" "$msg"
}

notify "[STARTED UP]: 42Wizard loaded successfully!"

# Sends your status to the API (and authenticates it with your userKey).
send_http_request() {
    local status=$1

    # Fetches userKey at ~/.42Wizard/userKey
    user_key_file="$HOME/.42Wizard/userKey"
    if [[ ! -f "$user_key_file" ]]; then
        notify "[ERROR]: Cannot fetch userKey at $HOME/.42Wizard"
        return
    fi
    user_key=$(cat "$user_key_file")

    # Sends status to the 42Wizard API.
    response=$(curl -s -w "%{http_code}" -o /tmp/curl_response_output -X POST -H "Content-Type: application/json" \
        -d "{\"status\": \"$status\", \"userKey\": \"$user_key\"}" https://42Wizard.fr/toggleLockStatus)
    http_code="${response: -3}"
    response_body=$(cat /tmp/curl_response_output)
    formatted_response=$(echo "$response_body" | jq -c -r .data.message)

    if [[ "$http_code" -ne 200 ]]; then
        notify "[ERROR]: $formatted_response"
    fi
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
