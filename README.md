# widget-hbs (beta)

## objectif
ce  projet est con�u pour vous permettre d'incorporer le HBS a vos sites internets sous forme de widget.
Il se compose d'une s�rie de *plugin jquery* qui s'interfacent avec des *templates handlebar* (la vue) & une *API jsonp* (le modele).


## personalisation
vous pouvez personnaliser le rendu � plusieurs niveaux : 
1. via un themeroller qui vous permet de modifier 
..* les parametres des plugins 
..* la feuille de style (en compilant une feuille de style less)
2. via les templates handlebars
..* par defaut, les templates g�n�riques sont charg�s
..* vous pouvez definir vos propores templates
..* ou surcharger ceux par defaut



## d�pendances 
* History.js 
* jQuery (employ� en mode noConflict)
* bootstrap 3 (les r�gles CSS sont namespac�es, vous pourriez m�me, en modifiant les templates, supprimer cette d�pendance)
* handlebar.js (qui sert de moteur de templates)
* bootstrap-datepicker
* typeahead.js 
 
 ## licence
 Le code source vous est fournit sous licence GPL V3, si vous employez ce code, merci de le forker sous gitHub et de nous faire des pull requests � chaque modification de code.
 Tant que possible nous souhaitons int�grer vos contributions au sein de notre branche.
 
 ## stabilit�
 Ce code est une version beta, son API est amen�e � �voluer. 
 L'integration des systemes de reservations se fera au cas par cas, ce qui veut dire que :
 * cette partie est instable (API non fig�e)
 * aucun connecteur n'est encore cod� au sein de la fiche detail
 * l'id�e actuelle est de cr�er un widget par connecteur.