var TelegramBot = require('node-telegram-bot-api');
var Cloud = require("./lib/cloud.js");

var token = process.env.TELEGRAM_BOT_TOKEN || '';

//to do not disturb chats in a debug session
var DEBUG_whenSpeak = 0; // when this chaiId fired a command
var DEBUG_showChatId = 0; // response with this chatId cloud

var bot = new TelegramBot(token, { polling: true });
var cloud = new Cloud();

bot.getMe().then(function (me) {
  console.log("Me: ", me);
});


bot.onText(/^\/summarize(.*)/, function (msg, match) {
  var chatId = msg.chat.id; 
  
  console.log(msg);
  
  var params=msg.text.split(" ");

  var filter = (typeof params[1] !="undefined") ? params[1] : "";

  console.log(params, filter);
    
  var genChatId=chatId;

  if(chatId == DEBUG_whenSpeak){
	  genChatId = DEBUG_showChatId;
  }
  
  bot.sendMessage(chatId, "Wait a moment...").then(function(a){
	  
	  var replyTo=a.message_id;
  
	  cloud.getCloud(genChatId, filter, function(err, file){
	  	console.log(err, file);
	  	if(!err){
		  	bot.sendPhoto(chatId, file, {caption: cloud.getCaption(filter)});
	  	}else{
		  	switch(err){
			  	case "NO_DATA":
				  	bot.sendMessage(chatId, "No enough words. Speak more :P");
			  	break;
			  	default:
			  		console.log(err);
			  		bot.sendMessage(chatId, "Something is wrong. Check logs!");
			  	break;
		  	}
	  	}
	  }); 
  
  })
  
});


bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  
  if('text' in msg){
	  var toSave = {
		chatId: chatId,
		date: msg.date,
		words: msg.text
	  };
	  
	  cloud.save(toSave); //fuck the callback
  }
  
});




