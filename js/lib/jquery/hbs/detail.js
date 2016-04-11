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
	
	var $	 				= jQuery;
	var pluginName 			= "b2fHbsDetail";
	var settings			= undefined;
	var pendingSearchJqXhr	= null;
	var $domContainer		= undefined;
	
	//fallback pour les appels a console.log : 
	if (typeof window.console === "undefined"){
		var console = {
				log:function () {}, info:function () {}, warn:function () {}, debug:function () {}, error:function () {}
		};
	} else {
		console = window.console;
	}
	//fin du fallback pour les appels a console.log : 
	
	$[ pluginName ] = function(action, options) {
		if ( action === "init") {
			_init(options);
		} if ( action === "open" ) {
			// Close popup code
			openDetail(options);
		} if (action === "close") {
			closeDetail()
		} else if (action === "armageddon") {
			return _armageddon(options);
		}
		
		return this;
	};
	
	
	
	$[ pluginName ].defaults = {
		triggerOnSelector 			: 'a[data-type="hbs-basic-lienDetail"]',//le plugin sera actif pour tous ces elements
		
		template					: 'hbs-basic-detail',
		fetchNewDataHost			: 'http://hbscms.caylus.b2f-concept.net',
		fetchNewDataUrl				: '/fr/hbs-ficheproduits.htm?render_mode=jsonp',
		moteurDeTemplate			: $.b2fHbsTemplate,//le plugin de template est cens� �tre pre-initialis�
		
		produit						: {},//il est possible de definir un produit par defaut via ce type de struct : {"produit_ref":"55954_160","fournisseur_id":10,"centrale_id":5,"agence_id":30,"commune":"champniers","titre":"ibis-angouleme-nord","type":"type-d-exemple"}
		
		onFetchNewData 				: function(data) {
			return data;
		},
		
		renderType					: 'inline', //peut prendre la valeur 'inline' ou 'modal'
		
		modalOptions				: {}, 	//employ� si renderType vaut 'modal'
		inlineOptions				: {		//employ� si renderType vaut 'inline'
			domContainer 				: 'div[data-type="hbs-detail-outter"]',
			boutonRetours 				: {
				selector	: 'a[data-type="hbs-detail-retours-listing"]',
				show		: true
			}
		},
		mapZoomLevel:8
	};
	

	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		
		$(document).off('hbsPluginArmageddon.'+pluginName);
		
		$domContainer.remove();
		$domContainer = undefined;
		
		$(document).off('click.'+pluginName);
		$(document).off('fetchNewData.'+pluginName);
		
		
		$(document).off('click.'+pluginName);
		$(document).off('pause.b2fHbsListing');
	
		
		//a faire en dernier, petti coquin ;package
		settings			= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function _init(options) {
		//d'abord, on lance un init GLOBAL valable pour tous les forms manipul�s
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			
			$domContainer = $('<div id="'+pluginName+'-outer"></div>').appendTo('body');//on se prepare en ajoutant une div a la fin du body
			
			$(document).on('click.'+pluginName						, settings.triggerOnSelector, fetchNewDataFromEvent); //lorsque l'internaute clique sur un bouton "voir la fiche produit", on ecoute l'event et on declenche une requete jsonp
			$(document).on('fetchNewData.'+pluginName	, renderData);						//lorsque la requete jsonp a finit de recup�rer les info, on ecoute leventement et on provoque l'affichage
			
			if ('inline' == settings.renderType) {
				$(document).on('click.'+pluginName 					, settings.inlineOptions.boutonRetours.selector, function() {$(document).trigger('backButton.'+pluginName, [{renderType:settings.renderType, visible:false}]);});
				$(document).on('pause.b2fHbsListing'	, onRetoursSurListing);
			}
			
			$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
			
			jQueryB2f.b2fHbsHistory('addRoute', {
				name		: pluginName,
				callback	: fetchNewDataFromCallbackRouteChanged,
				route		: /\/fr\/([-\w]+)-([-\w]+)-([-\w]+)--([-%\|\w]+)-([-\d]+)-([-\d]+)-([-\d]+).html\?debut=([-\d]*)&duree=([\d]*)/, 
				reverse		:'/fr/$type-$titre-$commune--$reference-$agence_id-$centrale_id-$fournisseur_id.html?debut=$debut&duree=$duree', 
				varMapping	:[
					'type',
					'titre',
					'commune',
					'reference',
					'agence_id',
					'centrale_id',
					'fournisseur_id',
					'debut',
					'duree'
				], 
				varAlias 	: {
					'type' : {
						'null' : '_'
					},
					'titre' : {
						'null' : '_'
					},
					'commune' : {
						'null' : '_'
					},
					'default' : {
						'null' : ''
					},
				}
			});
			
			jQueryB2f.b2fHbsHistory('start');
		}
		//fin de on lance un init GLOBAL valable pour tous les forms manipul�s
		
	}
	
	function openDetail(options) {
		fetchNewData(options);
	}
	
	/**
	* ceci est une fonciton de callback fournie � b2fHbsHistory lorsqu'on a aout� la route dans l'init de ce plugin => jQueryB2f.b2fHbsHistory('addRoute', ...
	* sa signature  est impos�e par b2fHbsHistory (programation par contrat)
	* 
	* @param urlToResolve
	* @param get l'equivalent de $_GET en PHP
	*/
	function fetchNewDataFromCallbackRouteChanged(urlToResolve, get) {
		console.log(pluginName+' fetchNewDataFromCallbackRouteChanged', urlToResolve, get);
		
		fetchNewData({produit:get});
	}
	
	function fetchNewDataFromEvent(event) {
		var cutomParams = $(this).data("liendetailParams");
		/*
		console.log(pluginName+' fetchNewDataFromEvent', cutomParams);
		fetchNewData(cutomParams);
		*/
		var stateSuccessfullyPushed = jQueryB2f.b2fHbsHistory('pushState', {data:cutomParams.produit, name:pluginName});
		if (false == stateSuccessfullyPushed) {
			fetchNewData(cutomParams);
		}
		
		//on bloque le bubling
		event.stopPropagation();
		return false;
	}
	
	function fetchNewData(cutomParams) {
		
		var produitParams = settings.produit;
		
		if (typeof cutomParams != "undefined") {
			if (typeof cutomParams.produit != "undefined") {
				$.extend(produitParams, cutomParams.produit)
			}
		}
		
		$(document).trigger('beforeFetchNewData.'+pluginName, [{renderType:settings.renderType, visible:true}]);
		$('body').addClass('b2f-hbs-detail-showing');
	    
		if ('inline' == settings.renderType) {
			var $inlineDomContainer = $(settings.inlineOptions.domContainer);
			$inlineDomContainer.empty();
			
			if ($(window).scrollTop() > $inlineDomContainer.offset().top) {
				$('html,body').animate({scrollTop:$inlineDomContainer.offset().top},'slow');
			}
		}
		
		//ajax 
		$.ajax({
				url			: settings.fetchNewDataHost + settings.fetchNewDataUrl,
				data		: cutomParams.produit,
				dataType 	: 'jsonp',
				beforeSend	: function( jqXHR ) {
					if (pendingSearchJqXhr != null) {
						pendingSearchJqXhr.abort();
					}
					pendingSearchJqXhr = jqXHR;
					$('body').addClass('b2f-hbs-detail-loading');
				}
		 	})
		 	.done(function( data, textStatus, jqXHR ) {
				
		 		data = settings.onFetchNewData.call(this, data);
			    $(document).trigger('fetchNewData.'+pluginName, [data]);
				
			    console.log(pluginName+'fetchNewData:done');
		 	})
		 	.fail(function( jqXHR, textStatus, errorThrown ) {
		 		console.log(pluginName+'fetchNewData:failed');
				$('body').removeClass('b2f-hbs-detail-showing');
				$(document).trigger('fetchNewDataFailed.'+pluginName, [{renderType:settings.renderType, visible:true}]);
		 	}).always(function( dataOrJqXHR, textStatus, jqXHROrErrorThrown ) {
		 		pendingSearchJqXhr = null;
				$('body').removeClass('b2f-hbs-detail-loading');
		 		console.log(pluginName+'fetchNewData:always');
		 	});
		//fin de ajax
		
		return true;
	}
	

	function renderData(event, data) {
		settings.moteurDeTemplate('render', {
			template 	: settings.template,
			params		: {"setting":settings,"settings":settings, "row":data},
			done		: function(newContent) {
				if ('modal' == settings.renderType) {
					$domContainer.empty().append(newContent) .find('.modal').modal(settings.modalOptions);
				} else if ('inline' == settings.renderType) {
					var $inlineDomContainer = $(settings.inlineOptions.domContainer);
					
					if ($inlineDomContainer.length == 0) {
						console.error(pluginName+' : settings.inlineOptions.domContainer introuvable ("'+settings.inlineOptions.domContainer+'")');
					}
					
					$inlineDomContainer.append(newContent);
				}
				
				$(document).trigger('renderData.'+pluginName, [data]);
			}
		});
		
				
		
	}
	
	function onRetoursSurListing(event, isPauseActive) {
		console.log('onRetoursSurListing', isPauseActive)
		if (false == isPauseActive) {
			$('body').removeClass('b2f-hbs-detail-showing');
			$(settings.inlineOptions.domContainer).empty();
		}
	}
	
})( jQueryB2f, window, document );