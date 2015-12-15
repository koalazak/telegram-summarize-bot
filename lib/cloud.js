var Canvas = require("canvas");
var fs=require("fs");
var jsdom = require("jsdom");
var document = jsdom.jsdom();
var d3=require("d3");
var cloud = require("d3-cloud");
var svg2png = require("svg2png");
var mongojs = require('mongojs');

var db = mongojs('resumebot', ['texts']);
db.texts=db.collection('texts');


module.exports = function Cloud(opts){

	var opts = opts || {};
	var ignoredWords  = opts.ignoredWords || ["o","no","si","sin","se","son","hay","al","te","que","es","por","para","las","los","de", "en", "le","la","lo","del","con","ese","esa", "el", "una", "un","zak","facu","facundo","mendez","zack","mendes","fac","faku","unos","uno","a","que","me","y","?"];
	var bannedStart = opts.bannedStart || ["/","http","@"];
	var bannedEnd    = opts.bannedEnd || ["?"];
	var width = opts.width || 1024;
	var height = opts.height || 800;
	var type = opts.type || "90";
	var minFontSize = opts.minFontSize || 20;
	var maxFontSize = opts.maxFontSize || 125;
	var requireMinWords = opts.requireMinWords || 40;
	var backgroundColor = opts.backgroundColor || "white";	
	var font = opts.font || "Impact";
	var savePath = opts.savePath || "./nubes";
	
	try {
		fs.statSync(savePath);
	}catch(e){
    	fs.mkdirSync(savePath);
	}
	
	return {
		
		getCloud: function (chatId, lapsus, cb){
		
			var _this = this;
			
			switch(lapsus){
				case "day":
					var mayorA = 60*60*24;
				break;
				case "week":
					var mayorA = 60*60*24*7;
				break;
				case "month":
					var mayorA = 60*60*24*30;
				break;
				case "year":
					var mayorA = 60*60*24*365;
				break;
				case "life":
					var mayorA = null;
				break;
				default:
					var mayorA = 60*60*24*2; //48hs
				break;
				
			}
			
			var filter = {chatId: chatId };
			if(mayorA){
				mayorA = parseInt((new Date().getTime()/1000)) - mayorA;
				filter.date = { $gte: mayorA };
			}
			console.log(filter);
			
			db.texts.find(filter).toArray(function(e,data){
		
				var words=[];
				for(var i=0; i< data.length; i++){
					
					var rawWords=data[i].words.split(" ").map(_this.parseWords).filter(function(v){return v;});
			
					for(var j=0; j<rawWords.length; j++){
						if(_this.isInside(rawWords[j], words)){
							words=_this.sumSize(rawWords[j], words);
						}else{
							if(ignoredWords.indexOf(rawWords[j]) == -1){
								words.push({text: rawWords[j], size:1});
							}
						}
					}
				}
				
				words=_this.reMap(words);
				if(words.length < requireMinWords){
					return cb("NO_DATA", null);
				}
				
				words=_this.sort(words);
				words=words.slice(0,300);
				console.log(words);
				console.log(words.length);
				
				_this.genCloud(words, function(words){
				
					return _this.draw(words, chatId, cb);
				
				});
			
			});
		
		},
		
		sort: function(words){
			
			function compare(a,b) {
			  if (a.size < b.size)
			    return 1;
			  if (a.size > b.size)
			    return -1;
			  return 0;
			}

			var ordenado=words.sort(compare);
						
			return ordenado;
		
		},
		
		genCloud: function (words, cb){
			
			var _this=this;
			
			cloud().size([width, height])
			    .canvas(function() { return new Canvas(1, 1); })
			    .words(words)
			    .padding(5)
			    .rotate(function() { return _this.angulo() })
			    .font(font)
			    .fontSize(function(d) { return d.size; })
			    .on("end", cb)
			    .start();
		    
		},
		
		draw: function (words, id, cb) { 
		
			var fill = d3.scale.category20();
		
			var svgInit=d3.select(document.body).html("").append("svg")
			    .attr("width", width)
			    .attr("height", height)
			    .attr("id","svg1")
			    .attr("xmlns","http://www.w3.org/2000/svg")
			    .attr("xmlns:xlink","http://www.w3.org/1999/xlink");
			    
			    if(backgroundColor){
				    svgInit.append("rect")
				    .attr("width", "100%")
				    .attr("height", "100%")
				    .attr("fill", backgroundColor);
			    }
		
				svgInit.append("g")
			    .attr("transform", "translate("+width/2+","+height/2+")")
				.selectAll("text")
			    .data(words)
				.enter().append("text")
			    .style("font-size", function(d) { return d.size + "px"; })
			    .style("font-family", font)
			    .style("fill", function(d, i) { return fill(i); })
			    .attr("text-anchor", "middle")
			    .attr("transform", function(d) {
			      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			    })
			    .text(function(d) { return d.text; });
		    
			var svg = d3.select(document.body).node().innerHTML;
	
			var unaDate= new Date().getTime();
			var destino= savePath+"/chat"+id+"-"+unaDate;
			
			fs.writeFileSync(destino+".svg", "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+svg);
							
			svg2png(destino+".svg", destino+".png", function (err) {
					
				cb(err, destino+".png");
					
			});
				
		},
		
		getCaption: function(parte){
		
			switch(parte){
				case 'day':
					return "Daily summary";
				break;
				case 'week':
					return "Weekly summary";
				break;
				case 'month':
					return "Monthly summary";
				break;
				case 'year':
					return "Annual summary";
				break;
				case 'life':
					return "General summary";
				break;
				default:
					return "Latest 48hs summary";
				break;
			}	
			
		},
		
		angulo: function(){
			
			if(type == "90"){
				return ~~(Math.random() * 2) * 90; //recto
			}else{
				return (~~(Math.random() * 6) - 3) * 30; //flashero
			}

		},
		
		parseWords: function (item){
			
			var word=item.toLowerCase().replace(/,/g, '').replace(/\"/g, '').replace(/\./g, '');
			
			for(var i=0; i< bannedStart.length; i++){
				if(word.indexOf(bannedStart[i]) == 0){
					return "";
				}
			}
			for(var i=0; i< bannedEnd.length; i++){
				if(word.indexOf(bannedEnd[i]) == word.length-1){
					return "";
				}
			}
			
			return word.trim();
		},
		
		map: function ( x,  in_min,  in_max,  out_min,  out_max){
		  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		},
		
		reMap: function (words){
		
			var max=1;
			for(var i=0; i< words.length; i++){
				if(words[i].size > max){
					max=words[i].size;
				}
			}
			
			for(var i=0; i< words.length; i++){
				words[i].size = parseInt(this.map(words[i].size, 1, max+1, minFontSize, maxFontSize));
			}
			
			return words;
		
		},
		
		isInside: function (aguja, pajar){
			
			for(var i=0; i< pajar.length; i++){
				if(pajar[i].text == aguja){
					return true;
				}
			}
			return false;
		},
		
		sumSize: function (word, words){
			
			for(var i=0; i< words.length; i++){
				if(words[i].text == word){
					words[i].size=words[i].size+1;
				}
			}
			
			return words;
		},
		
		save: function(toSave){
			
			db.texts.insert(toSave); //fuck the callback
			
		}
	}
	
}


