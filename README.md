# widget-hbs (beta)


## objectif
ce  projet est con�u pour vous permettre d'incorporer le HBS a vos sites internets sous forme de widget.
Il enrichit le widget pr�c�dent en vous donnant beaucoup plus de libert� de personnalisation.
Il se compose d'une s�rie de *plugin jquery* qui s'interfacent avec des *templates handlebar* (la vue) & une *API jsonp* (le modele).


## historique
Le HBS peut s'int�grer de plusieurs fa�ons : 
* via un acc�s direct � connectizz (WS REST/XML)
* via une int�gration par B2F au sein du HBS historique (dordogne.perigord-reservation.com , vacances-lotetgaronne.com , fr-comte.hbs.b2f-concept.net , montagne-jura-hiver-v2.hbs.b2f-concept.net , ...)
  * site autonome
  * site int�gr� en iframe au sein d'un autre site
* au sein de n'importe quel site via un widget 
  * widget historique
  * nouveau widget (https://github.com/b2fconcept/widget-hbs)



## personnalisation
vous pouvez personnaliser le rendu � plusieurs niveaux : 

1.  via un themeroller qui vous permet de modifier 
  * les param�tres des plugins 
  * la feuille de style (en compilant une feuille de style less)
2.  via les templates handlebars
  * par d�faut, les templates g�n�riques sont charg�s
  * vous pouvez d�finir vos propres templates
  * ou surcharger ceux par d�faut
3.  via les plugins jQuery open source
  * vous pouvez int�grer nos plugins h�berg�s sur les serveurs B2F
  * vous pouvez les modifier et les stocker sur vos serveurs



## d�pendances 
* History.js 
* jQuery (employ� en mode noConflict)
* bootstrap 3 (les r�gles CSS sont namespac�es, vous pourriez m�me, en modifiant les templates, supprimer cette d�pendance)
* handlebar.js (qui sert de moteur de templates)
* bootstrap-datepicker
* typeahead.js 
 
## licence
Le code source vous est fourni sous licence GPL V3, si vous employez ce code, merci de le forker sous gitHub et de nous faire des pull requests � chaque modification de code.
Tant que possible nous souhaitons int�grer vos contributions au sein de notre branche.
 
## stabilit�
Ce code est une version beta, son API est amen�e � �voluer. 
L'inte�ration des syst�mes de r�servations se fera au cas par cas, ce qui veut dire que :
* cette partie est instable (API non fig�e)
* aucun connecteur n'est encore cod� au sein de la fiche d�tail
* l'id�e actuelle est de cr�er un widget par connecteur.