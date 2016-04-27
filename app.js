"use strict";

exports.init = function () {

	// Set the standard number of news headlines to 5
	Homey.manager('settings').set('numberOfNewsArticles', 5);
	var headlineKeywords = ['Een', 'Twee', 'Drie', 'Vier', 'Vijf', 'Zes', 'Zeven', 'Acht', 'Negen', 'Tien', 'Elf', 'Twaalf', 'Dertien', 'Veertien', 'Vijftien', 'Zestien', 'Zeventien', 'Actien', 'Negentien', 'Twintig'];

	// Homey checks if it should read the news
	Homey.manager('flow').on('action.readNews', function(callback) {
		// Read the news
		// Download news headlines in JSON format,
		// and formulate the news headlines
		Homey.log('News headlines are being downloaded');
		require('http.min').json('http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=100&q=http://www.hln.be/rss.xml').then(function (data) {
			if(data !== undefined && data != null &&
			data.responseData !== undefined && data.responseData !== null &&
			data.responseData.feed !== undefined && data.responseData.feed !== null &&
			data.responseData.feed.entries !== undefined && data.responseData.feed.entries !== null &&
			data.responseData.feed.entries.length > 0 ) {
				// Concatenate everything
				var newsHeadlines = [];
				var maxNews = Homey.manager('settings').get('numberOfNewsArticles');
					maxNews = (maxNews > 8 ? 8 : (maxNews < 1 ? 1 : maxNews)); // Minimum of 1 article, maximum of 8 articles (~source limit)
					newsHeadlines.push('Je recente nieuws berichten.');

				for(var i = 0; i < maxNews; i++) {
					var title = data.responseData.feed.entries[i].title;
					if (title[title.length - 1] === ".") {
						title = title.slice(0, -1);
					}
					var content = data.responseData.feed.entries[i].content;
					if (content[content.length - 1] === ".") {
						content = content.slice(0, -1);
					}
					newsHeadlines.push(headlineKeywords[i] + '. ' + title + '. ' + content + '........ ');
					title = null;
					content = null;
				}

				// Spread the word
				for(var i = 0; i < newsHeadlines.length; i++) {
					Homey.manager('speech-output').say(__(newsHeadlines[i]));
				}
				callback(null, true);
			} else {
				callback(null, false);
			}
		});
	});

	// Homey checks for the news headlines to be triggered
	// i.e. through phrases like
	// What are the news headlines?
	// What is the recent news?
	Homey.manager('speech-input').on('speech', function(speech,callback) {
		// Iterate over every possible trigger as specified in
		// app.json
		speech.triggers.forEach(function(trigger) {
		// Check if the newsheadline trigger is triggered
			if(trigger.id === 'newsheadline') {
				// Read the news
				// Download news headlines in JSON format,
				// and formulate the news headlines
				Homey.log('News headlines are being downloaded');
				require('http.min').json('http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=100&q=http://www.hln.be/rss.xml').then(function (data) {
					if(data !== undefined && data != null &&
					data.responseData !== undefined && data.responseData !== null &&
					data.responseData.feed !== undefined && data.responseData.feed !== null &&
					data.responseData.feed.entries !== undefined && data.responseData.feed.entries !== null &&
					data.responseData.feed.entries.length > 0 ) {
						// Concatenate everything
						var newsHeadlines = [];
						var maxNews = Homey.manager('settings').get('numberOfNewsArticles');
							maxNews = (maxNews > 8 ? 8 : (maxNews < 1 ? 1 : maxNews)); // Minimum of 1 article, maximum of 8 articles (~source limit)
							newsHeadlines.push('Je recente nieuws berichten.');

						for(var i = 0; i < maxNews; i++) {
							var title = data.responseData.feed.entries[i].title;
							if (title[title.length-1] === ".") {
								title = title.slice(0,-1);
							}
							var content = data.responseData.feed.entries[i].content;
							if (content[content.length-1] === ".") {
								content = content.slice(0,-1);
							}
							newsHeadlines.push(headlineKeywords[i] + '. ' + title + '. ' + content + '........ ');
							title = null;
							content = null;
						}

						// Spread the word
						for(var i = 0; i < newsHeadlines.length; i++) {
							Homey.manager('speech-output').say(__(newsHeadlines[i]));
						}
					}
				});
			}
		});

	});

};

