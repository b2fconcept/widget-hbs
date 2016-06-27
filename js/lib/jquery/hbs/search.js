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
	var pluginName 			= "b2fHbsSearch";
	var settings			= undefined;
	var pendingSearchJqXhr	= null;
	var listDistinctFormFieldValuesByNames		= {}
	var templateCompiled	= {};
	var elementsCounter 	= 0;
	var page 				= 1;
	
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
		} else if ( action === "setPage" ) {
			// Close popup code
			setPage(options);
		} else if (action === "getPage") {
			return getPage();
		} else if (action === "pushCurrentState") {
			return pushCurrentState();
		} else if (action === "armageddon") {
			return _armageddon(options);
		}
		
		return this;
	};
	
	
	$[ pluginName ].defaults = {
		formSelector 		: 'form[data-type="hbs-basic-search"]',	//le plugin sera acif pour tous ces elements
		template			: 'hbs-basic-search-default-template',	//le template qui servira a afficher le formulaire
		moteurDeTemplate	: $.b2fHbsTemplate,//le plugin de template est cens� �tre pre-initialis�
		lieuAutocompleteHost: 'http://hbscms.caylus.b2f-concept.net',
		lieuAutocompleteUrl	: '/fr/connectizzautocompletelieu.htm?render_mode=jsonp',
		reloadOnRouteChange	: false,								//mettre a true par exemple sur une fiche detail afin que lorsqu'on arrive sur une route de type listing, on provoque un reload de la page, ça evite de devoir preparer une fiche produit a pouvoir contenir liste de resultat e moteur de rehcerche
		datepickerContainer : 'body',								//http://bootstrap-datepicker.readthedocs.org/en/stable/options.html#container
		communesAutocompleteMinLength : 1,
		onFormDataChange 	: function() {							//callback appelé lorsqu'un formulaire est modifié
		
		},
		
	};
	

	function setPage(newPage) {
		newPage = parseInt(newPage);
		if (page != newPage) {
			page = newPage
			$(document).trigger(pluginName+".paginationChange");;
		}
	}
	function getPage() {
		return page;
	}
	
	
	
	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		
		listDistinctFormFieldValuesByNames		= {}
		templateCompiled	= {};
		elementsCounter 	= 0;
		page 				= 1;
		
		$(document).off('hbsPluginArmageddon.'+pluginName);
		
		$(settings.formSelector).each(function() {
			$.removeData(this, pluginName+'_init') ;
			
			var $this = $(this);
			$this.off('change.'+pluginName);
			$this.find('div[data-provide="hbs-datepicker"]').datepicker('destroy').off('changeDate.'+pluginName);
			$this.find('input[name="b2f-hbs-lieu"]').typeahead('destroy').unbind('typeahead:select change.'+pluginName);
		});
		
		//a faire en dernier, petti coquin ;package
		settings			= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function _init(options) {
		//d'abord, on lance un init GLOBAL valable pour tous les forms manipulés
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			_initGlobal();
		}
		//fin de on lance un init GLOBAL valable pour tous les forms manipulés
		
		
		
		//ensuite, on lance un init LOCAL fait une fois par formulaire manipulé
		$(settings.formSelector).each(function() {
			//protection 'init run once'
			if ( $.data( this, pluginName+'_init' ) ) {
				return;
			}
			$.data(this, pluginName+'._init', true);//on stock la conf de ce widget dans le dom de l'elemnts qui l'instancie
			//fin de protection 'init run once'
			
			_initFormElement.call(this);
			
			elementsCounter = elementsCounter + 1;
		})
		//fin de on lance un init LOCAL fait une fois par formulaire manipulé
		
		
	    $(document).trigger(pluginName+'.initFinished').data(pluginName+'.initFinished', true);
	}
	
	//init GLOBAL valable pour tous les forms manipulés
	function _initGlobal() {
		
		$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
		
		var regexpIndex = '^'+document.location.protocol+'\/\/'+document.location.host+'\/?$';
		
		
		jQueryB2f.b2fHbsHistory('addRoute', {
			name		: pluginName,
			callback	: fetchNewDataFromCallbackRouteChanged,
			route		: /\/fr\/([-_\w]*)-([_\d]*)-personnes-([-_\w]*)-([_ab\d]*)-([-_\w]*)-([-_\w]*)-([-_\w]*).html\?debut=([-_\d]*)&duree=([_\d]*)&page=([_\d]*)/, 
			reverse		:'/fr/$typeLogement-$pax-personnes-$lieux_ville-$lieux_codePostal-$lieux_departement-$lieux_region-$lieux_pays.html?debut=$debut&duree=$duree&page=$page', 
			//onReverse	: function(urlStr) {return urlStr.replace(/(--+)/g, '-');}
			varMapping	:[
				
				'typeLogement',
				'pax',
				//'b2f-hbs-lieu',
				//'lieu',
				'lieux_ville',
				'lieux_codePostal',
				'lieux_departement',
				'lieux_region',
				'lieux_pays',
				'debut',
				'duree',
				//'b2f-hbs-date',
				//'b2f-hbs-duree',
				'page'
				
				
			], 
			varAlias 	: {
				'pax' : {
					'6-' : '6'
				},
				'default' : {
					'null' : '_'
				}
			},
			varReplace 	: [
				{from:'_', to:'__'},
				{from:'-', to:'_'}
			]
		});
		
		jQueryB2f.b2fHbsHistory('addRoute', {
			name		: pluginName+'Index',
			callback	: fetchNewDataFromCallbackRouteChanged,
			route		: new RegExp(regexpIndex) ,
			reverse		:'/', 
			varMapping	:[]
		});
		
		jQueryB2f.b2fHbsHistory('start');

	}
	
	//init LOCAL fait une fois par formulaire manipulé
	function _initFormElement() {
		
		
		var $this = $(this);
		
		$.data(this, pluginName+'_settings', $.extend(true, {instanceNumber:elementsCounter}, settings, $this.data( pluginName.toLowerCase()+'ExtendSettings' )));//on accepte des settings custom
		
		var elementSettings = $.data(this, pluginName+'_settings');
		
	//	console.debug('elementsCounter & affliés : ', settings.elementSettings);
		
		/*
		if (!(elementSettings.template in templateCompiled)) {
			var source   = $('#'+elementSettings.template).html();
			if (undefined == source) {source = ''};
			templateCompiled[ elementSettings.template ] = Handlebars.compile(source);
		}
		var newContent = templateCompiled[ elementSettings.template ]({settings:elementSettings});
		*/
		settings.moteurDeTemplate('render', {
			template 	: elementSettings.template,
			params		: {"settings":elementSettings},
			done		: function(newContent) {
				$this.empty().append(newContent);
				
				
				$this.find('input, select').each(function() {
					var $this = $(this);
					listDistinctFormFieldValuesByNames[$this.attr('name')] = $this.val();
				});
				
				
				if ('body' != elementSettings.datepickerContainer) {
					$(elementSettings.datepickerContainer).prependTo('body');//sinon la mise en page deconne
				}
				
				var $currentHbsDatepicker = $this.find('div[data-provide="hbs-datepicker"]')
				$currentHbsDatepicker.datepicker({ //@see https://github.com/eternicode/bootstrap-datepicker
						"clearBtn" 	: true,
						"autoclose"	: true,
						"language"	: 'fr',
						"container"	: elementSettings.datepickerContainer,
						"startView"	: "year",
						"startDate"	: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), //"+1d", //format : cf => https://github.com/eternicode/bootstrap-datepicker/blob/ca11c450/README.md#options
						"format"	: {
							toDisplay: function (date, format, language) {
								
								return $.fn.datepicker.DPGlobal.formatDate(date, 'D d M yyyy', language);
							},
							toValue: function (date, format, language) {
								
								return $.fn.datepicker.DPGlobal.formatDate(date, 'yyyy-mm-dd', language);
							}
						},
					})
					.on('changeDate.'+pluginName, function(event,b,c,d,e) {
						var idOfHiddenInput = 'hidden-val-of-'+$currentHbsDatepicker.find('input').attr('id');
						var $inputHidden = $('#'+idOfHiddenInput);
						if ($inputHidden.length == 0) {
							var inputHidden = document.createElement('input'); inputHidden.type = 'hidden'; inputHidden.id = idOfHiddenInput; inputHidden.name = 'debut';
							$currentHbsDatepicker.after(inputHidden);
							$inputHidden	= $(inputHidden);
						}
						
						//hack pour contourner un bug du datepicker : ne me demandez pas pourquoi, ici, le formatDate bug et renvoie la veille, on triche donc en ajoutant un jour a la date afin de contourner le bug...  
						var DateReformated = new Date(event.date);
						DateReformated.setDate(DateReformated.getDate()+1);
						//fi hack pour contourner un bug 
						
						$inputHidden.val($.fn.datepicker.DPGlobal.formatDate(DateReformated, 'yyyy-mm-dd', 'fr'));
						//console.debug('change 1(changeDate)', $currentHbsDatepicker.find('input[name="debut"]').val());
					});
				
				//console.debug('hbsDatepicker : ', $currentHbsDatepicker);
				
				//recup data du moteur de suggestion de communes
				var CommunesBloodhound = new Bloodhound({ //https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md
					  datumTokenizer: Bloodhound.tokenizers.whitespace,
					  queryTokenizer: Bloodhound.tokenizers.whitespace,
					  minLength 	:elementSettings.communesAutocompleteMinLength,
					  local: [],//pas de var locales
					  //prefetch :'',//pas de prefetch
					  remote  : {
						url			: elementSettings.lieuAutocompleteHost + elementSettings.lieuAutocompleteUrl,
						//wildcard 	: '#QUERY',
						prepare: function(query, settings) {
		                    settings.dataType 	= "jsonp"
			                settings.data 		= {"q":query}
		                    return settings;
		                },
					
						transform 	: function (response) {
							return response.ville;
						}
						
					 }
					 
				});
				var DepartementsBloodhound = new Bloodhound({ //https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md
					  datumTokenizer: Bloodhound.tokenizers.whitespace,
					  queryTokenizer: Bloodhound.tokenizers.whitespace,
					  minLength 	:elementSettings.communesAutocompleteMinLength,
					  local: [],//pas de var locales
					  //prefetch :'',//pas de prefetch
					  remote  : {
						url			: elementSettings.lieuAutocompleteHost + elementSettings.lieuAutocompleteUrl,
						//wildcard 	: '#QUERY',
						prepare: function(query, settings) {
		                    settings.dataType 	= "jsonp"
				            settings.data 		= {"q":query}
		                    return settings;
		                },
						/*
						prepare 	: function (query, bloodhoundSettings) {
							return bloodhoundSettings;
						},
						*/
						transform 	: function (response) {
							return response.dept;
						}
						
					 }
					 
				});
				//fin de recup data du moteur de suggestion de communes
				//affichage moteur de suggestion de communes
				$this.find('input[name="b2f-hbs-lieu"]').typeahead(
					{
					  highlight: true
					}, {
					  name: 'commune',
					  display: function(row) {
						  return row.ville+' '+row.departement+' ('+row.codePostal+') ';
					  },
					  source: CommunesBloodhound,
					  limit:999,
					  templates: {
						    empty: [
								      '<div class="empty-message">',
								        'Aucune commune ne correspond à votre saisie, merci de la modifier, svp',
								      '</div>'
								    ].join('\n'),
							pending:  Handlebars.compile('<div>Recherche en cours...</div>'),
							header:  Handlebars.compile('<h3 class="">Commune</h3>'),
						    suggestion: Handlebars.compile('<div><strong>{{ville}}</strong> {{departement}} ({{codePostal}}) </div>')
					  }
					}, {
						  name: 'departement',
						  display: function(row) {
							  return row.departement+' ('+row.region+') ';
						  },
						  source: DepartementsBloodhound,
						  limit:999,
						  templates: {
							    empty: '',
								pending:  '',
								header:  Handlebars.compile('<h3 class="">D&eacute;partement</h3>'),
							    suggestion: Handlebars.compile('<div><strong>{{departement}}</strong> ({{region}}) </div>')
						  }
						}
				).bind('typeahead:select change.'+pluginName, function(event, suggestion) {
					 ///'typeahead:select' 		: evenement interne à la lib. typeahead qui gere l'autocompletion
					 ///'change.'+pluginName 				: evenement standard, namespacé afin  de pouvoir le unbind
					 
					
					
					var instanceNumber 				= $this.data(pluginName+'_settings').instanceNumber;
					var typeofSuggestionIsdefined 	= (typeof suggestion !== 'undefined');
					var lieuFull 					= [];
					
					
					if (typeofSuggestionIsdefined && typeof suggestion.ville !== 'undefined') {
						var ville 		= suggestion.ville;
						lieuFull.push(ville);
					} else {
						var ville 		= '';
					}
					
					if (typeofSuggestionIsdefined && typeof suggestion.codePostal !== 'undefined') {
						var codePostal 		= suggestion.codePostal;
						lieuFull.push(codePostal);
					} else {
						var codePostal 		= '';
					}
					
					if (typeofSuggestionIsdefined && typeof suggestion.departement !== 'undefined') {
						var departement 		= suggestion.departement;
						lieuFull.push(departement);
					} else {
						var departement 		= '';
					}
					
					if (typeofSuggestionIsdefined && typeof suggestion.region !== 'undefined') {
						var region 		= suggestion.region;
						lieuFull.push(region);
					} else {
						var region 		= '';
					}
					
					if (typeofSuggestionIsdefined && typeof suggestion.pays !== 'undefined') {
						var pays 		= suggestion.pays;
						lieuFull.push(pays);
					} else {
						var pays 		= '';
					}
					
					
					$('#b2f-hbs-search-lieu_full-instance'+instanceNumber			).val(lieuFull.join(', ')); 
					$('#b2f-hbs-search-lieux_ville-instance'+instanceNumber			).val(ville);
					$('#b2f-hbs-search-lieux_codePostal-instance'+instanceNumber	).val(codePostal);
					$('#b2f-hbs-search-lieux_departement-instance'+instanceNumber	).val(departement);
					$('#b2f-hbs-search-lieux_region-instance'+instanceNumber		).val(region);
					$('#b2f-hbs-search-lieux_pays-instance'+instanceNumber			).val(pays);
					
					//console.debug("debg autocmpte", departement, region)
					
					if (event.type == "typeahead:select") {
						$this.trigger('change');  
					}
				});
				//fin de affichage moteur de suggestion de communes
				
				
				
				$this.on('change.'+pluginName, {page:1}, onFormDataChange);
			}
		});
		
		
				
	}
	
	
	/**
	* ceci est une fonciton de callback fournie à b2fHbsHistory lorsqu'on a aouté la route dans l'init de ce plugin => jQueryB2f.b2fHbsHistory('addRoute', ...
	* sa signature  est imposée par b2fHbsHistory (programation par contrat)
	* 
	* @param urlToResolve
	* @param get l'equivalent de $_GET en PHP
	*/
	function fetchNewDataFromCallbackRouteChanged(urlToResolve, get) {
		
		if (settings.reloadOnRouteChange) {
			window.location.reload();
		}
		
		var lieuFull 		= [];
		var listeChampsLieu = ['lieux_ville', 'lieux_codePostal', 'lieux_departement', 'lieux_region', 'lieux_pays'];
		for (var key in listeChampsLieu) {
			if (typeof get[listeChampsLieu[key]] !== 'undefined' && get[listeChampsLieu[key]] != '') { lieuFull.push(get[listeChampsLieu[key]]);}
		}
		get['lieu'] = lieuFull.join(', ');
		get['b2f-hbs-lieu'] = get['lieu'];//c'est pas le meme formattage que quand on passe par l'autocompletion, mais ça fera l'affaire...
		
		if (typeof get['debut'] !== 'undefined' && get['debut'] != '') {
			get['date'] = $.fn.datepicker.DPGlobal.formatDate(new Date(get['debut']), 'D d M yyyy', 'fr');
		}
		
		$(settings.formSelector).first().trigger('change', [{pushState:false, dataSrc:get}]);
	}
	
	/**
	* cette fonction eest en charge de faire mémoriser les parametres dans l'url
	*
	*/
	function pushCurrentState() {
		var data = $.extend({page:'', debut:''}, listDistinctFormFieldValuesByNames);

		for (var dataKey in data) {
			data[dataKey] = $.b2fHbsTemplate('toUrl', data[dataKey]);;
		}
		
		//console.log(pluginName+' pushCurrentState', {data:data, name:pluginName});
		return jQueryB2f.b2fHbsHistory('pushState', {data:data, name:pluginName});
	}
	
	function onFormDataChange(event, options) {
		if (typeof options === 'undefined') {
			options = {};
		}
		
		
		var $this 			= $(this);
		//var $thisSerialize 	= $this.serialize();
		//var dataSrc = $this.serializeArray();		
		var thisSettings 	= $.data( this, pluginName+'_settings' );
		
		if (typeof event.data.page !== 'undefined') {
			setPage(event.data.page);
		}
		
		
		var dataSrc = [];
		if (typeof options.dataSrc === 'undefined') {
			dataSrc = $this.serializeArray();
		} else {
			dataSrc = options.dataSrc;
			if (! Array.isArray(dataSrc)) {
				dataSrc = serializeArray(dataSrc);
			}
		}
	    
		//ici, on duplique la valeur dans tous les formulaires pris en charge par le widget, d'apres mes recherches, ça ne devrait pas lancer l'evenemtn change, si ça le change, il faudra trouver une solution de contournement, notamment regarder qui l'a lancé au début de cette fonciton afin den ne pas tourner en boucle
	    $(settings.formSelector).each(function() {
	    	var $thisFormSelectorCurrElemt = $(this);
	    	$.each(dataSrc, function() {
	    		var thisarrayItem = this;
	    		
	    		var $thisFormSelectorCurrElemtInput = $thisFormSelectorCurrElemt.find('[name="'+thisarrayItem.name+'"]');
	    		
	    		if ($thisFormSelectorCurrElemtInput.length > 0) {
	    			$thisFormSelectorCurrElemtInput.val(thisarrayItem.value);
					//console.debug('thisFormSelectorCurrElemtInput update : ', thisarrayItem.name, thisarrayItem.value, $thisFormSelectorCurrElemtInput.val(), thisarrayItem, $thisFormSelectorCurrElemtInput);
	    		} 
	    		
	    		listDistinctFormFieldValuesByNames[thisarrayItem.name] = thisarrayItem.value;
	    	});
	    });
	    //fin de ici, on duplique la valeur dans tous les formulaires
	    
		
		if (typeof options.pushState === 'undefined' || true == options.pushState) {
			if (pushCurrentState()) { //pushCurrentState va a son tour nous appeler mais avec options.pushState à false... donc si on coupe pas le traitement ave cun return, on provoque deux parsing des datas + deux requetes jsonp. NB : il faudrait mieux scinder tout ça en plusieurs methode,s mais là, j'ai pas le temps
				return;
			}
		}
		
	    //callback et events
	    thisSettings.onFormDataChange.call(event, $this);
	    $(document).trigger(pluginName+'.formDataChange');
	    //fin des callback et events
		
		//console.info(pluginName,' onFormDataChange', this, event)
	}
	
	
	
	
	
	/**
	 * permet d'obtenir la liste des input au format de jQuery.serializeArray()
	 * 
	 * @return array
	 */
	$[ pluginName ].serializeArray = function() {
		var arrayAuBonFormat = [];
		
		arrayAuBonFormat = serializeArray(listDistinctFormFieldValuesByNames);
		arrayAuBonFormat.push({"name":"page", "value":page});
		
		return arrayAuBonFormat;
	};
	
	function serializeArray(objAConvertir) {
		var arrayAuBonFormat = [];
		
		$.each(objAConvertir, function(name, value) {
			arrayAuBonFormat.push({"name":name, "value":value});
		});
		
		return arrayAuBonFormat;
	}
	
})( jQueryB2f, window, document );