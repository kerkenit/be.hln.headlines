/* global Homey, module */
(function() {
	'use strict';
}());
exports.init = function() {
	var striptags = require('striptags');
	var numberOfNewsArticles = Homey.manager('settings').get('numberOfNewsArticles');
	if (numberOfNewsArticles === undefined || numberOfNewsArticles === null) {
		Homey.manager('settings').set('numberOfNewsArticles', 5);
	}
	var newslength = Homey.manager('settings').get('newslength');
	if (newslength === undefined || newslength === null) {
		Homey.manager('settings').set('newslength', 100);
	}
	var headlineKeywords = [__('app.numbers.one'), __('app.numbers.two'), __('app.numbers.three'), __('app.numbers.four'), __('app.numbers.five'), __('app.numbers.six'), __('app.numbers.seven'), __('app.numbers.eight'), __('app.numbers.nine'), __('app.numbers.ten'), __('app.numbers.eleven'), __('app.numbers.twelve'), __('app.numbers.thirteen'), __('app.numbers.fourteen'), __('app.numbers.fiveteen'), __('app.numbers.sixteen'), __('app.numbers.seventeen'), __('app.numbers.eightteen'), __('app.numbers.nineteen'), __('app.numbers.twenty')];
	String.prototype.beautify = function() {
		return this.replace('  ', '').replace('"', '').replace("'", "").replace("\"", "").replace("-", " ").trim();
	};

	String.prototype.endsWith = function(suffix) {
	    return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
	var formatHeadline = function(text) {
			text = text.replace('"', '');
			text = text.replace("'", "");
			text = text.replace("\"", "");
			text = striptags(text).substr(0, 255);
			var index = text.lastIndexOf('.');
			return [text.slice(0, index), text.slice(index + 1)][0] + '.';
		};
	var replaceContent = function(text) {
			if (text !== undefined) {
				text = text.replace(__('app.findandreplace.kmph.find'), __('app.findandreplace.kmph.replace'));
				text = text.replace(__('app.findandreplace.mph.find'), __('app.findandreplace.mph.replace'));
				text = text.replace(__('app.findandreplace.co2.find'), __('app.findandreplace.co2.replace'));
				text = text.replace(__('app.findandreplace.rivm.find'), __('app.findandreplace.rivm.replace'));
				text = text.replace(__('app.findandreplace.om.find'), __('app.findandreplace.om.replace'));
				text = text.replace(__('app.findandreplace.rdw.find'), __('app.findandreplace.rdw.replace'));
				text = text.replace(__('app.findandreplace.who.find'), __('app.findandreplace.who.replace'));
				text = text.replace(__('app.findandreplace.wmo.find'), __('app.findandreplace.wmo.replace'));
				text = text.replace(__('app.findandreplace.bbc.find'), __('app.findandreplace.bbc.replace'));
				text = text.replace(__('app.findandreplace.youp.find'), __('app.findandreplace.youp.replace'));
				text = text.replace(__('app.findandreplace.nos.find'), __('app.findandreplace.nos.replace'));
				text = text.replace(__('app.findandreplace.taser.find'), __('app.findandreplace.taser.replace'));
				text = text.replace(__('app.findandreplace.is.find'), __('app.findandreplace.is.replace'));
				text = text.replace(__('app.findandreplace.nasa.find'), __('app.findandreplace.nasa.replace'));
				text = text.replace(__('app.findandreplace.elnino.find'), __('app.findandreplace.elnino.replace'));

				return text;
			} else {
				return '';
			}
		};
	var createSpeechText = function(textRaw) {
			var text = [];
			//cut at last space every 255 chars
			var senetenceParts = textRaw.split(/[,.!\?\:;]+/g);
			for (var i = 0; i < senetenceParts.length; i++) {
				if (senetenceParts[i].length >= 255) {
					var textHelper = senetenceParts[i].substr(0, 255);
					var textIndexLastSpaceBefore255 = senetenceParts[i].lastIndexOf(' ');
					text.push(senetenceParts[i].substr(0, textIndexLastSpaceBefore255).beautify());
					text.push(senetenceParts[i].substr(textIndexLastSpaceBefore255, senetenceParts[i].length).beautify());
				} else {
					text.push(senetenceParts[i].beautify());
				}
			}
			return text.filter(Boolean);
		};

	Homey.manager('flow').on('action.readNews', function(callback, args) {
		Homey.log('News headlines are being downloaded');
		var FeedMe = require('feedme');
		var http = require('http');

		var newsHeadlines = [];
		var Headlines = [];
		var maxNews = args.itemcount;
		maxNews = (maxNews > 20 ? 20 : (maxNews < 1 ? 1 : maxNews)); // Minimum of 1 article, maximum of 20 articles (~source limit)
		newsHeadlines.push(__('app.speechPrefix'));
		var i = 0;
		http.get(Homey.env.feed, function(res) {
			var parser = new FeedMe();
			parser.on('item', function(item) {
				if (i < maxNews) {
					Homey.log(item.title);
					var title = replaceContent(item.title.beautify());
					var content = striptags(replaceContent(item.description));
					if (title.length > 0 && content.length > 0) {
						newsHeadlines.push(formatHeadline(headlineKeywords[i] + '. ' + title + '. '));
						if(args.newslength === 'full') {
							var description = createSpeechText(content);
							for (var j = 0; j < description.length; j++) {
								newsHeadlines.push(description[j]);
							}
						}
						else if(args.newslength !== 'headline') {
							var words = content.split(' ', Number(args.newslength));
							var descriptions = words.join(' ');
							if(!descriptions.endsWith('.')) {
								descriptions = descriptions.substr(0, descriptions.lastIndexOf(".")+1);
							}
							descriptions = createSpeechText(descriptions.substr(0, descriptions.length));

							for (var k = 0; k < descriptions.length; k++) {
								newsHeadlines.push(descriptions[k]);
							}
						}
					}
				}
				i++;
			});
			parser.on('end', function() {
				for (var j = 0; j < newsHeadlines.length; j++) {
					Homey.manager('speech-output').say(__(newsHeadlines[j]));
				}
			});
			res.pipe(parser);
		});
		callback(null, true);
	});

	// Homey checks for the news headlines to be triggered
	// i.e. through phrases like
	// What are the news headlines?
	// What is the recent news?
	Homey.manager('speech-input').on('speech', function(speech, callback) {
		// Iterate over every possible trigger as specified in
		// app.json
		speech.triggers.forEach(function(trigger) {
			// Check if the newsheadline trigger is triggered
			if (trigger.id === 'newsheadline') {
				// Read the news
				// Download news headlines in JSON format,
				// and formulate the news headlines
				Homey.log('News headlines are being downloaded');
				var FeedMe = require('feedme');
				var http = require('http');
				// Concatenate everything
				var newsHeadlines = [];
				var maxNews = Homey.manager('settings').get('numberOfNewsArticles');
				var newslength = Homey.manager('settings').get('newslength');

				maxNews = (maxNews > 20 ? 20 : (maxNews < 1 ? 1 : maxNews)); // Minimum of 1 article, maximum of 20 articles (~source limit)
				newsHeadlines.push(__('app.speechPrefix'));
				var i = 0;
				http.get(Homey.env.feed, function(res) {
					var parser = new FeedMe();
					parser.on('item', function(item) {
						if (i < maxNews) {
							Homey.log(item.title);
							var title = replaceContent(item.title.beautify());
							var content = striptags(replaceContent(item.description));
							if (title.length > 0 && content.length > 0) {
								newsHeadlines.push(formatHeadline(headlineKeywords[i] + '. ' + title + '. '));
								if(newslength === undefined || newslength === null) {
									var description = createSpeechText(content);
									for (var j = 0; j < description.length; j++) {
										newsHeadlines.push(description[j]);
									}
								} else {
									var words = content.split(' ', newslength);
									var descriptions = words.join(' ');
									if(!descriptions.endsWith('.')) {
										descriptions = descriptions.substr(0, descriptions.lastIndexOf(".")+1);
									}
									descriptions = createSpeechText(descriptions.substr(0, descriptions.length));

									for (var k = 0; k < descriptions.length; k++) {
										newsHeadlines.push(descriptions[k]);
									}
								}
							}
						}
						i++;
					});
					parser.on('end', function() {
						for (var j = 0; j < newsHeadlines.length; j++) {
							Homey.manager('speech-output').say(__(newsHeadlines[j]));
						}
					});
					res.pipe(parser);
				});
			}
		});
	});
};