# 42Wizard

**42Wizard** is a Discord BOT developed for 42 students at Paris. It helps students to check user connections (lock) and sends notifications via Discord (and mail if enabled) when they are about to be deloggable. 

## Functionnalities

- **Connections lookup** : 42Wizard can detect when a student has clicked the lock button or if he is relogged.
- **Notifications** : 42Wizard sends a message to a student 5 minutes via Discord (and mail if enabled) before he is able to be delogged. If you have been delogged by another student, you will be notified.
- **Leaderboard system**: You can see who are the students that delog the most and who are they who got delogged the most.
- **Find system**: You can get informations about a student (Where he is logged in at, how many times he delogged students and how many times he got delogged).

## Installation

1. **Invite 42Wizard** : Use [this link](https://discord.com/oauth2/authorize?client_id=1300932692749189235) to invite 42Wizard to your Discord account.
2. **Configure direct messages** : Make sure that you can send messages to the BOT (For the moment, Discord does not automatically create a direct messages channel/send an event when the application is installed for a user. You can execute a 42Wizard command by typing `/` in DMs with one of your friends/other BOTs. You can then go to the 42Wizard profile to open the direct messages channel.).
3. **View commands** : Type `/` to open the commands panel. There is also a `/commands` command.

## Commands

- **/find** : Gives informatons about a 42 student.
- **/leaderboard**: Gives the leaderboard of the deloggers and their victims.
- **/commands** : Gives informations about 42Wizard commands.
- **/link** : Commands to manage the link between your Discord and your 42 account.

## Mini-API

- The base link of 42Wizard is https://42wizard.fr/
- **(Public)**
    - **GET** [/assets](https://42wizard.fr/assets) : Can only get the avatar of 42Wizard for the mails (at [/assets/resized_avatar.png](https://42wizard.fr/assets/resized_avatar.png)).
    - **GET [/confirm/:syncKey](https://42wizard.fr/confirm)** : The system that verifies the link between a Discord account and a 42 account via mail.
    - **GET [/getAwardedStudents](https://42wizard.fr/getAwardedStudents)** : Gives the `😈👑 Professional Delogger` student and the favourite victim if another system requires that information (To get a title, why not ?).

- **(Private) Only accessible from a cluster host**
    - **GET** [/](https://42wizard.fr/) : Only to test if the access is well protected.
    - **POST /toogleLockStatus** `{status: "The status, locked or unlocked", userKey: "The student authentication key"}` : Called by the `script.sh`, this part of the API executes the appropriate actions depending on the status of the student's host.
    - **ALL** : Just sends a 404/405 error response according to the request method.

Reponse format: `JSON`
```js
{
    status: "number: The status code of the response",
    response: "string: The string version of the status code (e.g. if status is 404, response will be Not Found)",
    data: null or {
        "message": "string or undefined: the message of an error, if occurred",
        "all the data depending of the request."
    }
}
```

## Settings

- **/link toggle_enabled**: You can disable or enable the system when you want (You will no longer receive mails or messages but stats can change).
- **/link toggle_mail**: You can enable or disable mails from 42Wizard.
- **/link toggle_avatar**: If you don't want 42Wizard to store the link to your avatar (your photo), you can do it.
- **/link toggle_hidden**: If you want to use 42Wizard but do not want to be visible from the other students (on find command or on the leaderboard), you can do it.

## How the 42 data is used ?

Every 42 seconds, 42Wizard scans all the clusters on the Paris campus, storing cluster informations (cluster ID, host name) as well as information about the user connected to the host (login and avatar (photo)). A student not connected to 42Wizard will have his avatar set to a default avatar (Stormtrooper from Star Wars). The same applies to a student who doesn't want his avatar to be visible. These informations are then used to find out who is connected, when and where. They are also stored internally, in SQL databases (You can see how databases are made on 42Wizard by checking the ClientManager.js file). No highly confidential personal informations are stored, to respect the students and because they are simply useless to 42Wizard.

The commands in the "Settings" section allow you to make your own privacy choices.

If you still have questions about this, feel free to read the source code or ask directly on Discord to (murasakinx, login 42: mel-habi).

## Disclaimer

**⚠️ This tool isn't intended to promote delogging people, it's just for fun. If abuse is detected, the people involved will be banned from the system or the service will cease to exist. Please, don't abuse, be serious and respectful to your mates. ⚠️**

By murasakinx (mel-habi)
