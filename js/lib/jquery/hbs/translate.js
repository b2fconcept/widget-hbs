/*
   widget personnalisable pour le HBS (connectizz)
   Copyright (C) 2016  B2f-concept
   
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation version 3 of the License.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software Foundation,
   Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
   
   vous pouvez nous contacter via notre site web http://www.b2f-concept.com rubrique contact
*/


/**
* exemple d'usage avancé : 

si on a un {"inject" => "mon $pote est $type"} alors on peut appeler : jQueryB2f.b2fHbsTranslate('inject', {"pote":"toto", type:"sympa"}) ce qui donne "mon toto est sympa"

*
*
*/

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( jQuery, window, document, undefined ) {
	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).
	
	
	"use strict"; //http://www.w3schools.com/js/js_strict.asp
	
	var $	 				= jQuery;
	var pluginName 			= "b2fHbsTranslate";
	var settings			= undefined;
	var currLangue 			= undefined;
	var cacheOfDictionnaire	= {};
	var loadedDictionnaires	= {};
	var warnDoneFor			= {};
	
	//fallback pour les appels a console.log : 
	if (typeof window.console === "undefined"){
		var console = {
				log:function () {}, info:function () {}, warn:function () {}, debug:function () {}, error:function () {}
		};
	} else {
		console = window.console;
	}
	//fin du fallback pour les appels a console.log : 
	
	$[ pluginName ] = function(keyWord, injectMe, warn) {
		//console.debug(pluginName+'.tradKeyword.debut', keyWord, injectMe);
		
		var trad = keyWord;
		
		
		if (typeof cacheOfDictionnaire[currLangue][keyWord] === "undefined") {
			if (typeof warnDoneFor[keyWord] === "undefined" && (typeof warn === 'undefined' || warn == true)) {
				console.warn(pluginName, ' -> il manque le keyword "'+keyWord+'"');
				warnDoneFor[keyWord] = true;
			}
		} else {
			trad = cacheOfDictionnaire[currLangue][keyWord];
		}
		
		if (typeof injectMe !== "undefined") {
			trad = trad.replace(/\$(\w+)/g, function(match, sousChaine1, offset, string) {
				var value = injectMe[sousChaine1];
				if (value === undefined) {
					return match;
				}
				if (value === null) {
					return '';
				}
				return value;
			});
		}
		
		return trad;
	};
	
	
	
	
	$[ pluginName ].defaults = {
		"langue"					: 'fr',
		"remoteDictionnaires"		: [],// #langue# est rempalcé par la langue courante, exemple : ['/js/lib/jquery/hbs/translate/default.js.php?langue=#langue#']
		"preloadedDictionnaires"	: []//tableau de collection de trad de trad sous la forme {fr:{keyword1:"trad1", keyword2:"trad2"}}
	};
	
	$[ pluginName ].init = function(options) {
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			
			currLangue = settings.langue;
			
			fetchNewDictionnarie();
			
			$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
		}
		
		return this;
	}
	
	$[ pluginName ].armageddon = function(options) {
		_armageddon(options);
		return this;
	}
	
	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		
		$(document).off('hbsPluginArmageddon.'+pluginName);
		
		
		currLangue 			= undefined;
		cacheOfDictionnaire	= {};
		loadedDictionnaires	= {};
		//honnetement, les warn sur les keywords, on a pas besoin de les re-init dans le themeroller, ça va plus gêner qu'autre chose => warnDoneFor			= {};
	
		
		//a faire en dernier, petit coquin ;)
		settings			= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function fetchNewDictionnarie() {
		$.each(settings.preloadedDictionnaires, function(index, dictionnaire) {
			$.extend(cacheOfDictionnaire, dictionnaire);
		});
		
		$.each(settings.dictionnaires, function(index, dictionnaire) {
			dictionnaire = dictionnaire.replace('#langue#', currLangue);
			if (typeof loadedDictionnaires[dictionnaire] !== "undefined") {
				return;//itération "$.each" suivante => car on a deja chargé ce dictionnaire
			}
			loadedDictionnaires[dictionnaire] = true;
			//ajax : lorsque les data changent, il faut rafraichir tous les moteurs afin qu'ils soient mis à jour, pour cela, on interroge le serveur avec le snouveaux params
			$.ajax({
					url			: dictionnaire,
					dataType 	: 'jsonp',
				})
				.done(function(data , textStatus, jqXHR ) {
					if (typeof cacheOfDictionnaire[currLangue] === "undefined") {
						cacheOfDictionnaire[currLangue] = {};
					}
					
					$.extend(cacheOfDictionnaire[currLangue], data);
					
					console.log('fetchNewDictionnarie.extend.cacheOfDictionnaire', currLangue, cacheOfDictionnaire);
				})
				.fail(function( jqXHR, textStatus, errorThrown ) {
					console.error(pluginName+' fetchNewDictionnarie.ajax.fail');
				}).always(function( dataOrJqXHR, textStatus, jqXHROrErrorThrown ) {
					//console.debug('fetchNewDictionnarie.ajax.always');
				});
			//fin de ajax

		});
		
		return true;
	}
	
	
	
})( jQueryB2f, window, document );