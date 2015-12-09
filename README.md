# Telegram summarize Bot

A bot to summarize conversations in a tag cloud

## Install

```bash
$ git clone https://github.com/koalazak/telegram-summarize-bot.git
$ cd telegram-summarize-bot
$ npm install
```

## Steps to create a new Bot and get your API token

Talk to [BotFather](https://telegram.me/botfather):
```bash
/newbot
Summarize Bot
summarize_bot
/setcommands
summarize - Usage: /summarize [ day | week | month | yeat | life ]
/setprivacy false
```
More info: [Telegram Bots](https://core.telegram.org/bots)

## Options

```javascript

var options = {
	ignoredWords : ["el","la","y"],
	bannedStart : ["/","http","@"],
	bannedEnd : ["?"],
	width : 1024,
	height : 800,
	type : "90",
	minFontSize : 25,
	maxFontSize : 120,
	requireMinWords : 50,
	backgroundColor : "white",
	font : "Impact",
	savePath : "./nubes"
};

var cloud = new Cloud(options);


```


## Run

```bash
$ TELEGRAM_BOT_TOKEN=your_token node app.js
```

## Invite

Invite your new bot to your group chats and use the /summarize command.


