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
	
	var $ 					= jQuery;
	var pluginName 			= "b2fHbsHistory";
	var settings			= undefined;
	var tabOfRoutes			= [];
	var Routes				= {};
	//fallback pour les appels a console.log : 
	if (typeof window.console === "undefined"){
		var console = {
				log:function () {}, info:function () {}, warn:function () {}, debug:function () {}, error:function () {}, table:function () {}
		};
	} else {
		console = window.console;
	}
	//fin du fallback pour les appels a console.log : 
	
	$[ pluginName ] = function(action, options) {
		if ( action === "init") {
			_init(options);
		} else if ( action === "addRoute" ) {
			addRoute(options);
		} else if (action === "start") {
			start(options);
		} else if (action === "pushState") {
			return pushState(options);
		} else if (action === "buildUrlFromRoute") {
			return buildUrlFromRoute(options);
		} else if (action === "armageddon") {
			return _armageddon(options);
		}
		
		return this;
	};
	
	
	$[ pluginName ].defaults = {
		isReEcritureActive	: true,//destiné aux sites web ne voulant aps mettre en palce des regles de re-ecriture
		isHistoryActive		: true,//deprecié, destiné au themeroller, mais provoque des bugs
		enabled				: true//destiné au themeroller, si a false, on ne push pas de state 
	};
	
	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		Routes			= {};
		tabOfRoutes		= [];
		$(document).off('hbsPluginArmageddon.'+pluginName);
		$(window).unbind('statechange.'+pluginName); //pour retirer le listener pos� dans le init => History.Adapter.bind(window, 'statechange.'+pluginName, statechange) =>  http://stackoverflow.com/a/19369150/1138863
		
		//a faire en dernier
		settings 		= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function _init(options) {
		//d'abord, on lance un init GLOBAL valable pour tous les forms manipul�s
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			_initGlobal();
		}
		//fin de on lance un init GLOBAL valable pour tous les forms manipul�s
		
		
	}
	
	//init GLOBAL valable pour tous les forms manipul�s
	function _initGlobal() {
		// Prepare
		var History = window.History; // Note: We are using a capital H instead of a lower h
		
		
		if (false == settings.enabled) {
			console.warn(pluginName+' settings.enabled vaut false : on doit être sur le themeroller! On ne s\'init pas, et on passe Hitsory.js en mode html4');
			History.options.html4Mode = true;
			return false;
		}
		
		if (false == settings.isHistoryActive || '0' == settings.isHistoryActive) {
			History.enabled = false;
		}
		
		if ( !History.enabled ) {
			 // History.js is disabled for this browser.
			 // This is because we can optionally choose to support HTML4 browsers or not.
			return false;
		}
		
		
		
		if (false == settings.isReEcritureActive || '0' == settings.isReEcritureActive) {
			History.options.html4Mode = true;
		}

		// Bind to StateChange Event
		History.Adapter.bind(window, 'statechange.'+pluginName, statechange); // Note: We are using statechange instead of popstate
		
		$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
	}
	
	function addRoute(Route) {
		var varAliasReverse = {};
		if (typeof Route.varAlias !== 'undefined') {
			for (var aliasName in Route.varAlias) {
				varAliasReverse[aliasName] = {};
				for (var aliasValToSubstitute in Route.varAlias[aliasName]) {
					varAliasReverse[aliasName][Route.varAlias[aliasName][aliasValToSubstitute]] = aliasValToSubstitute;
				}
			}
		}
		if (typeof Route.varReplace !== 'undefined') {
			Route.varReplaceReversedOrder 	= [];
			var varReplaceLength 			= Route.varReplace.length -1;
			for (var varReplaceIndexReverse = 0;  varReplaceIndexReverse <= varReplaceLength; varReplaceIndexReverse++) {
				Route.varReplaceReversedOrder[varReplaceIndexReverse] = Route.varReplace[varReplaceLength-varReplaceIndexReverse]
			}
		}
		
		
		
		Routes[Route.name] = $.extend({varAliasReverse:varAliasReverse, varAlias:{}}, Route);;
		
		tabOfRoutes.push(Route.name);
	}
	
	function run(urlToResolve) {
		if (typeof urlToResolve !== 'string') {
			return false;
		}
		
		var get			= {};
		var routeFound 	= false;
		var matches 	= false;
		$.each(tabOfRoutes, function(index, name) {
			var routeCandidat 	= Routes[name];
			matches 			= urlToResolve.match(routeCandidat.route);
			if (null != matches && matches.length > 0) {
				routeFound = routeCandidat;
				matches.shift();//la premiere entr�e est l'url complete, elle nous pollue les varMapping plus bas si on la laisse
				return false;//on coupe le $.each(); (return false produit un break)
			}
		});//fin $.each
		
		
		
		
		$.each(routeFound.varMapping, function(index, varName) {
			if (typeof matches[index] === 'undefined' ) {
				console.error(pluginName+' run("'+urlToResolve+'") pas de match pour "'+varName+'" situ� � l\'index n�'+index);
				get[varName] = null;
			} else {
				get[varName] = matches[index];
			}
			
			var alias = {};
			if (typeof routeFound.varAliasReverse[varName] !== 'undefined') {
				alias = routeFound.varAliasReverse[varName];
			} else if (typeof routeFound.varAliasReverse.default !== 'undefined') {
				alias = routeFound.varAliasReverse.default;
			}
			
			if (typeof alias[get[varName]] !== 'undefined') {
				if (alias[get[varName]] === 'null') {
					get[varName] = '';
				} else {
					get[varName] = alias[get[varName]];
				}
			} else {
				if (typeof routeFound.varReplaceReversedOrder !== 'undefined') {
					$.each(routeFound.varReplaceReversedOrder, function (replaceNumber, varReplace) {
						if (typeof get[varName] == 'string') {
							get[varName] = get[varName].replace(new RegExp(varReplace.to, 'g'), varReplace.from);
						}
					});
				}
			}
			
			
			
			
		})
		
		if (false == routeFound) {
			return false;
		}
		
		//console.info(pluginName+'::run resultat ---> route ("'+urlToResolve+'"):', routeFound, ' matches : ', matches, 'get : ', get);
		
		return routeFound.callback(urlToResolve, get);
	}
	
	function statechange() {
		
		var State = History.getState();
		run(State.url) ;
	}
	
	function start(options) {
		var State = History.getState();
		run(State.url) ;
	}
	
	/**
	* gere la re-ecriture d'url (la generation d'une url re-ecrite en focnti�on d'une route + des params a ecrire en sons sein)
	* 
	* soit le premer parametre est un object avec deux clefs : {routeName:, data:}, soit on a deux param a la fonction
	* data est optionel 
	*/
	function buildUrlFromRoute(routeName, data) {
		if (typeof routeName == 'undefined') {
			return;
		} 
		if (typeof routeName  == 'object' && typeof routeName.routeName  !== 'undefined') {
			if (typeof routeName.data !== 'undefined')  {
				data = routeName.data;
			}
			routeName = routeName.routeName;
		}
		
		if (typeof data === 'undefined')  {
			data = {};
		}
		
		var route 	= Routes[routeName];
		var url		= undefined;
		var alias 	= {};
		var get		= $.extend({}, data);
		
		$.each(data, function (varName, varValue) {
			if (typeof route.varAlias[varName] !== 'undefined') {
				alias = route.varAlias[varName];
			} else if (typeof route.varAlias.default !== 'undefined') {
				alias = route.varAlias.default;
			}
			if (typeof alias[get[varName]] !== 'undefined') {
				get[varName] = alias[get[varName]];
			} else if ((get[varName] == null || get[varName] == '') && typeof alias['null'] !== 'undefined') {
				get[varName] = alias['null'];
			} else {
				if (typeof route.varReplace !== 'undefined') {
					$.each(route.varReplace, function (replaceNumber, varReplace) {
						if (typeof get[varName] == 'string') {
							get[varName] = get[varName].replace(new RegExp(varReplace.from, 'g'), varReplace.to);
						}
					});
				}
			}
			
			
					
		})
		
		url 		= $.b2fHbsTranslate(route.reverse, get, false);
		
		return url;
	}
	
	function pushState(options) {
		if (false == settings.enabled) {
			console.warn(pluginName+' settings.enabled vaut false : on ne procede pas aux pushState!');
			return false;
		}
		if (History.enabled == false) {
			console.log('History.enabled est a false, on ne procede pas aux pushState');
			return false;
		}
		var data 	= (typeof options.data 	!== 'undefined') ? options.data		: {};
		var title 	= (typeof options.title !== 'undefined') ? options.title	: null;
		var url 	= (typeof options.url 	!== 'undefined') ? options.url		: undefined;
		
		var routeName = (typeof options.name 	!== 'undefined') ? options.name		: undefined;
		
		if (typeof routeName != 'undefined') {
			url = buildUrlFromRoute(routeName, data);
		}
		if (url == undefined) {
			return false;
		}
		
		History.pushState(data, title, url);//History.pushState(data,title,url) 
		return true;
	}
	
	/*
	function storeHistoryChange(event, historyPluginName, datas, title) {
		var $this 			= $(this);
		
		if (historyPluginName == 'b2fHbsSearch') {
			return storeHistoryChangeB2fHbsSearch(event, datas, title);
		} else if (historyPluginName == 'b2fHbsDetail') {
			return storeHistoryChangeB2fHbsDetail(event, datas, title);
		} else {
			console.error(pluginName+' plugin "'+historyPluginName+'" non g�r�');
		}
		
	}
	
	function storeHistoryChangeB2fHbsSearch(event, datas, title) {
		
		var typeLogement = (typeof datas.typeLogement !== 'undefined')?datas.typeLogement:false;
		
		
		url = '/fr/';
		History.pushState(null, title, url);//History.pushState(data,title,url) 
	}
	
	function storeHistoryChangeB2fHbsDetail(event, datas, title) {
		
	}

	*/
	
	
	
})( jQueryB2f, window, document );