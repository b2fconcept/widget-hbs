# widget-hbs (beta)


## objectif
ce  projet est conçu pour vous permettre d'incorporer le HBS a vos sites internets sous forme de widget.
Il enrichit le widget précédent en vous donnant beaucoup plus de liberté de personnalisation.
Il se compose d'une série de *plugin jquery* qui s'interfacent avec des *templates handlebar* (la vue) & une *API jsonp* (le modele).


## historique
Le HBS peut s'intégrer de plusieurs façons : 
* via un accès direct à connectizz (WS REST/XML)
* via une intégration par B2F au sein du HBS historique (dordogne.perigord-reservation.com , vacances-lotetgaronne.com , fr-comte.hbs.b2f-concept.net , montagne-jura-hiver-v2.hbs.b2f-concept.net , ...)
  * site autonome
  * site intégré en iframe au sein d'un autre site
* au sein de n'importe quel site via un widget 
  * widget historique
  * nouveau widget (https://github.com/b2fconcept/widget-hbs)



## personalisation
vous pouvez personnaliser le rendu à plusieurs niveaux : 
1. via un themeroller qui vous permet de modifier 
  * les parametres des plugins 
  * la feuille de style (en compilant une feuille de style less)
2. via les templates handlebars
  * par defaut, les templates génériques sont chargés
  * vous pouvez definir vos propores templates
  * ou surcharger ceux par defaut
3. via les plugins jQuery open source
  * vous pouvez intégrer nos plugins hébérgés sur les serveurs B2F
  * vous pouvez les modifier et les stocker sur vos serveurs



## dépendances 
* History.js 
* jQuery (employé en mode noConflict)
* bootstrap 3 (les rêgles CSS sont namespacées, vous pourriez même, en modifiant les templates, supprimer cette dépendance)
* handlebar.js (qui sert de moteur de templates)
* bootstrap-datepicker
* typeahead.js 
 
 ## licence
 Le code source vous est fournit sous licence GPL V3, si vous employez ce code, merci de le forker sous gitHub et de nous faire des pull requests à chaque modification de code.
 Tant que possible nous souhaitons intégrer vos contributions au sein de notre branche.
 
 ## stabilité
 Ce code est une version beta, son API est amenée à évoluer. 
 L'integration des systemes de reservations se fera au cas par cas, ce qui veut dire que :
 * cette partie est instable (API non figée)
 * aucun connecteur n'est encore codé au sein de la fiche detail
 * l'idée actuelle est de créer un widget par connecteur.