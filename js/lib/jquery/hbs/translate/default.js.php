<?php 
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



header("Content-type: application/javascript"); 



//tentative de cache
session_cache_limiter('public');

$last_modified_time = filemtime($_SERVER['SCRIPT_FILENAME']);
$etag = md5_file($_SERVER['SCRIPT_FILENAME']).$_GET['langue'];

header("Last-Modified: ".gmdate("D, d M Y H:i:s", $last_modified_time)." GMT");
header("Etag: $etag");

if (@strtotime(@$_SERVER['HTTP_IF_MODIFIED_SINCE']) == $last_modified_time || trim(@$_SERVER['HTTP_IF_NONE_MATCH']) == $etag) {
	header("HTTP/1.1 304 Not Modified");
	exit;
}

header("Pragma: public");
$expires = 60*60*24*14;
header('Cache-Control: maxage='.$expires.', must-revalidate');
header('Expires: ' . gmdate('D, d M Y H:i:s', time()+$expires) . ' GMT');
//fin de tentative de cache



ob_start('ob_gzhandler');

require_once('B2f/BootStrap.php');
@session_write_close();

$lang = B2f_Langue::getInstance();
if (isset($_GET['langue'])) {
	$lang->setLangue($_GET['langue']);
}

//ici on force la surcharge des GLOBALS si on est dans un contexte marque blanche
if(@$_GET['mbKey']!=''){
	B2f_Request::setMarqueBlancheKey($_GET['mbKey']);
	B2f_Config::overideGlobals();
}

$trad = $GLOBALS['b2f']['translate'];
$trad->addPage('Connectizz');

$url = new B2f_View_Helper_Url();
$smarty_obj = null;//jsuqu'� preuve du contraire, je ne le declare que pour le passer par reference � B2f_View_Helper_Url qui ne s'en sert pas donc pas besoin d'instancier une objet smarty rellement

/*
 * exemples de code accessibles (surtout des helper)
// - <?=$url->href(array('name'=>'panier-miseajour'), $smarty_obj)?>
// - <?=$trad->_('VEL_PrixProduit_Alerte_Quantite')?>
// - <?=$trad->js("VEL_Nb_Personne_Non_Renseigner") ?>
*/



$arrayTradJS = array(

	"par personne"					=> "par personne",
	"selon disponibilit�s"			=> "selon disponibilit�s",
	"D�tail & reservation"			=> "D�tail & reservation",
	"Prix, D�tail & reservation"	=> "Prix, D�tail & reservation",
	'pour $nuit nuit(s)'			=> 'pour $nuit nuit(s)', 
	'jusqu\'a $nbPaxMax personnes'	=> 'jusqu\'a $nbPaxMax personnes', 
	
	"par personne"					=> "par personne",
	"par personne"					=> "par personne",
	"par personne"					=> "par personne",
	"par personne"					=> "par personne",
	"par personne"					=> "par personne",
	
	
	//"pageDetail" : {reference:produit_ref, fournisseur_id:fournisseur_id, centrale_id:centrale_id, agence_id:agence_id, commune:commune, titre:titre);
	"pageDetail"					=> '/fr/$type-a-$commune-$titre-$fournisseur_id-$centrale_id-$agence_id-$reference.html?debut=$debut&duree=$duree',
	"Equipements"					=> 'Equipements : ',
	"Le prix comprends"				=> 'Le prix comprends : ',
	"Le prix ne comprends pas"		=> 'Le prix ne comprends pas : ',

	"tifv3_null"	=> " ", 
	"tifv3_1"	=> " ", 
	"tifv3_2"	=> " ", 
	"tifv3_3"	=> " ", 
	"tifv3_4"	=> " ", 
	
	/**
	* ci dessous : 
	* tous les champs tifv3, je l'ai hardcod�, c'est plus simple, voici la requete : 
	*
	SELECT  DISTINCT CONCAT('"tifv3_',  valeur, '"') , ':' , CONCAT('"', lib, '",')
FROM produit_caracteritique 
INNER JOIN tifv3_thesaurus ON tifv3_thesaurus.thesaurus = valeur
WHERE caracteristique_id IN (32,33,34)
UNION DISTINCT
SELECT DISTINCT CONCAT('"tifv3_',  libelle, '"') , ':' , CONCAT('"', lib, '",')
FROM produit_caracteristique_libelle 
INNER JOIN tifv3_thesaurus ON tifv3_thesaurus.thesaurus = libelle
WHERE caracteristique_id IN (32,33,34);
	*
	*
	*/
	"tifv3_02.01.01.02.23"           =>       "Escrime", 
	"tifv3_02.01.01.02.25"           =>       "Golf",
	"tifv3_02.01.01.02.67"           =>       "Surf",
	"tifv3_02.01.01.02.70"           =>       "Tennis",  
	"tifv3_02.01.01.02.76"           =>       "Voile",   
	"tifv3_02.01.01.03.03"           =>       "Cours",   
	"tifv3_02.01.03.03.38"           =>       "Randonn�e",  
	"tifv3_02.01.04.01.04"           =>       "Chalet",  
	"tifv3_02.01.04.01.06"           =>       "Maison",  
	"tifv3_02.01.08.01.14"           =>       "Discoth�que",
	"tifv3_02.01.08.01.24"           =>       "Piscine", 
	"tifv3_02.01.08.01.31"           =>       "Parc � th�mes", 
	"tifv3_02.01.08.01.33"           =>       "Salle de remise en forme",
	"tifv3_02.01.08.01.40"           =>       "Thalassoth�rapie",   
	"tifv3_02.01.11.09.24"           =>       "Ferme",   
	"tifv3_02.01.13.01.08"           =>       "Restauration Rapide", 
	"tifv3_04.04.04"                 =>       "Serveur vocal",   
	"tifv3_06.04.01.06.03"           =>       "Grand confort",   
	"tifv3_06.05"                    =>       "Tourisme et handicap",
	"tifv3_08.02.03.14"              =>       "Pied des pistes", 
	"tifv3_10.02.21"                 =>       "Personnes � mobilit� r�duite", 
	"tifv3_13.02.04"                 =>       "Carte bleue", 
	"tifv3_13.02.11"                 =>       "Ch�ques Vacances",   
	"tifv3_13.04.03.02"              =>       "Petit-d�jeuner", 
	"tifv3_14.01.01"                 =>       "Appartements",
	"tifv3_14.02.08"                 =>       "Garage",  
	"tifv3_14.02.09"                 =>       "Garderie",
	"tifv3_14.02.13"                 =>       "Parking", 
	"tifv3_14.02.15"                 =>       "Restaurant",  
	"tifv3_14.02.18"                 =>       "Salle d'exposition",  
	"tifv3_14.02.24"                 =>       "Salle de r�union",   
	"tifv3_14.02.26"                 =>       "Salle de s�minaire", 
	"tifv3_14.03.01.04"              =>       "Maisons ind�pendantes",  
	"tifv3_14.03.02.05"              =>       "Balcon",  
	"tifv3_14.03.02.08"              =>       "Cave",
	"tifv3_14.03.02.13"              =>       "Cuisine", 
	"tifv3_14.03.02.17"              =>       "Garage",  
	"tifv3_14.03.02.22"              =>       "Jardin",  
	"tifv3_14.03.02.26"              =>       "Salon",   
	"tifv3_14.03.02.30"              =>       "Terrasse",
	"tifv3_15.02.14"                 =>       "Conf�rences",
	"tifv3_15.02.15"                 =>       "D�gustation de produits",
	"tifv3_15.02.16"                 =>       "�quitation", 
	"tifv3_15.02.21"                 =>       "Golf",
	"tifv3_15.02.30"                 =>       "Parcours de sant�",  
	"tifv3_15.02.38"                 =>       "Produits fermiers",   
	"tifv3_15.02.42"                 =>       "Ski alpin",   
	"tifv3_15.02.59"                 =>       "Thalassoth�rapie",   
	"tifv3_15.02.61"                 =>       "Thermalisme", 
	"tifv3_15.02.62"                 =>       "Thermoludisme",   
	"tifv3_15.03.01"                 =>       "Acc�s Internet", 
	"tifv3_15.03.02"                 =>       "Acc�s Internet dans les chambres",   
	"tifv3_15.03.03"                 =>       "Air conditionn�",
	"tifv3_15.03.04"                 =>       "Aspirateur",  
	"tifv3_15.03.06"                 =>       "Baignoire",   
	"tifv3_15.03.07"                 =>       "C�ble / Satellite",  
	"tifv3_15.03.08"                 =>       "Canal+",  
	"tifv3_15.03.09"                 =>       "Chambres non fumeur", 
	"tifv3_15.03.10"                 =>       "Chauffage",   
	"tifv3_15.03.11"                 =>       "Chemin�e",   
	"tifv3_15.03.13"                 =>       "Chemin�e en fonctionnement", 
	"tifv3_15.03.14"                 =>       "Climatisation",   
	"tifv3_15.03.15"                 =>       "Coffre",  
	"tifv3_15.03.16"                 =>       "Cong�lateur",
	"tifv3_15.03.17"                 =>       "Cuisine - coin cuisine",  
	"tifv3_15.03.18"                 =>       "Double vitrage",  
	"tifv3_15.03.19"                 =>       "Douche",  
	"tifv3_15.03.21"                 =>       "Draps et linges compris", 
	"tifv3_15.03.22"                 =>       "Eau chaude",  
	"tifv3_15.03.23"                 =>       "Four",
	"tifv3_15.03.24"                 =>       "Installations pour handicap�s",  
	"tifv3_15.03.26"                 =>       "Lavabos eau chaude",  
	"tifv3_15.03.27"                 =>       "Lave linge collectif",
	"tifv3_15.03.28"                 =>       "Lave linge privatif", 
	"tifv3_15.03.29"                 =>       "Lave vaisselle",  
	"tifv3_15.03.30"                 =>       "Lavoirs eau chaude",  
	"tifv3_15.03.31"                 =>       "Lit b�b�",  
	"tifv3_15.03.32"                 =>       "Lit enfant",  
	"tifv3_15.03.33"                 =>       "Machines � laver",   
	"tifv3_15.03.34"                 =>       "Magn�toscope",   
	"tifv3_15.03.35"                 =>       "Mini-bar",
	"tifv3_15.03.37"                 =>       "Prise de t�l�vision",   
	"tifv3_15.03.38"                 =>       "Prise r�seau (acc�s Internet depuis le logement)",  
	"tifv3_15.03.39"                 =>       "Radio",   
	"tifv3_15.03.40"                 =>       "R�frig�rateur", 
	"tifv3_15.03.41"                 =>       "Sanitaires chauff�s",
	"tifv3_15.03.42"                 =>       "S�che cheveux",  
	"tifv3_15.03.43"                 =>       "S�che linge collectif",  
	"tifv3_15.03.44"                 =>       "S�che linge privatif",   
	"tifv3_15.03.45"                 =>       "S�che serviettes",   
	"tifv3_15.03.46"                 =>       "Chaise b�b�",   
	"tifv3_15.03.47"                 =>       "Table � langer", 
	"tifv3_15.03.52"                 =>       "T�l�copie", 
	"tifv3_15.03.53"                 =>       "T�l�phone", 
	"tifv3_15.03.54"                 =>       "T�l�phone direct",  
	"tifv3_15.03.55"                 =>       "T�l�phone r�serv� aux clients",   
	"tifv3_15.03.56"                 =>       "T�l�vision",
	"tifv3_15.03.58"                 =>       "T�l�vision couleur",
	"tifv3_15.03.60"                 =>       "Terrasse privative",  
	"tifv3_15.03.61"                 =>       "Terrasse privative/Balcon",   
	"tifv3_15.03.62"                 =>       "Toilette s�par�e",  
	"tifv3_15.05.02"                 =>       "Abris pour v�lo ou VTT", 
	"tifv3_15.05.04"                 =>       "Acc�s handicap�s",  
	"tifv3_15.05.05"                 =>       "Aire de jeux",
	"tifv3_15.05.06"                 =>       "Aire de pique-nique", 
	"tifv3_15.05.07"                 =>       "Ascenseur",   
	"tifv3_15.05.09"                 =>       "Bac � sable",
	"tifv3_15.05.10"                 =>       "Balan�oire", 
	"tifv3_15.05.101"                =>       "Salle de sport",  
	"tifv3_15.05.103"                =>       "Salle hors-sac couverte", 
	"tifv3_15.05.104"                =>       "Coin salon",  
	"tifv3_15.05.105"                =>       "Salon",   
	"tifv3_15.05.106"                =>       "Salon de jardin", 
	"tifv3_15.05.107"                =>       "Salon de t�l�vision",   
	"tifv3_15.05.108"                =>       "Sanitaire commun",
	"tifv3_15.05.110"                =>       "Sauna",   
	"tifv3_15.05.111"                =>       "Sentiers balis�s",   
	"tifv3_15.05.116"                =>       "Tables de pique-nique",   
	"tifv3_15.05.117"                =>       "Tennis",  
	"tifv3_15.05.118"                =>       "Terrain clos",
	"tifv3_15.05.119"                =>       "Terrain de jeux �quip�",
	"tifv3_15.05.12"                 =>       "Bar", 
	"tifv3_15.05.120"                =>       "Terrain ferm� la nuit",  
	"tifv3_15.05.121"                =>       "Terrain non clos",
	"tifv3_15.05.122"                =>       "Terrain ombrag�",
	"tifv3_15.05.123"                =>       "Terrasse",
	"tifv3_15.05.124"                =>       "Terrasse balcon", 
	"tifv3_15.05.125"                =>       "Toboggan",
	"tifv3_15.05.126"                =>       "Toilette s�par�e",  
	"tifv3_15.05.127"                =>       "Toilettes",   
	"tifv3_15.05.128"                =>       "Tous commerces",  
	"tifv3_15.05.13"                 =>       "Bar � th�me",   
	"tifv3_15.05.132"                =>       "Terrain semi-ombrag�",   
	"tifv3_15.05.14"                 =>       "Barbecue",
	"tifv3_15.05.17"                 =>       "Biblioth�que",   
	"tifv3_15.05.18"                 =>       "Billard", 
	"tifv3_15.05.19"                 =>       "Boulodrome",  
	"tifv3_15.05.20"                 =>       "Boutiques",   
	"tifv3_15.05.21"                 =>       "Bowling", 
	"tifv3_15.05.22"                 =>       "Branchements d'eau",  
	"tifv3_15.05.23"                 =>       "Branchements �lectriques",   
	"tifv3_15.05.24"                 =>       "Cabine t�l�phonique / Point Phone", 
	"tifv3_15.05.25"                 =>       "Cano�-Kayak",
	"tifv3_15.05.26"                 =>       "Caravaneige", 
	"tifv3_15.05.29"                 =>       "Cin�ma", 
	"tifv3_15.05.31"                 =>       "Cour",
	"tifv3_15.05.32"                 =>       "Discoth�que",
	"tifv3_15.05.33"                 =>       "Emplacement camping car", 
	"tifv3_15.05.34"                 =>       "Entr�e ind�pendante",   
	"tifv3_15.05.35"                 =>       "Equipements enfants (Lits, chaises)", 
	"tifv3_15.05.36"                 =>       "Etablissement thermal",   
	"tifv3_15.05.37"                 =>       "Etage",   
	"tifv3_15.05.39"                 =>       "Garage",  
	"tifv3_15.05.41"                 =>       "Garage priv�",   
	"tifv3_15.05.44"                 =>       "Hammam",  
	"tifv3_15.05.47"                 =>       "Jacuzzi", 
	"tifv3_15.05.48"                 =>       "Jardin",  
	"tifv3_15.05.50"                 =>       "Jardin ind�pendant", 
	"tifv3_15.05.51"                 =>       "Jardin Ombrag�", 
	"tifv3_15.05.52"                 =>       "Jeux pour enfants",   
	"tifv3_15.05.55"                 =>       "Lac et Plan d'eau",   
	"tifv3_15.05.57"                 =>       "Mat�riel de sport",  
	"tifv3_15.05.59"                 =>       "Mini-golf",   
	"tifv3_15.05.60"                 =>       "Mitoyen locataire",   
	"tifv3_15.05.62"                 =>       "Ombrage partiel", 
	"tifv3_15.05.63"                 =>       "Parc",
	"tifv3_15.05.64"                 =>       "Parking", 
	"tifv3_15.05.65"                 =>       "Parking autocar", 
	"tifv3_15.05.67"                 =>       "Parking priv�",  
	"tifv3_15.05.68"                 =>       "Patinoire",   
	"tifv3_15.05.69"                 =>       "Piano bar",   
	"tifv3_15.05.70"                 =>       "Piscine", 
	"tifv3_15.05.71"                 =>       "Piscine couverte",
	"tifv3_15.05.72"                 =>       "Piscine d�couverte", 
	"tifv3_15.05.73"                 =>       "Piscine enfants", 
	"tifv3_15.05.74"                 =>       "Piscine plein air",   
	"tifv3_15.05.78"                 =>       "Piste de ski alpin",  
	"tifv3_15.05.79"                 =>       "Piste de ski de fond",
	"tifv3_15.05.80"                 =>       "Plage",   
	"tifv3_15.05.82"                 =>       "Plan d'eau",  
	"tifv3_15.05.83"                 =>       "Plain Pied",  
	"tifv3_15.05.86"                 =>       "Restaurant",  
	"tifv3_15.05.87"                 =>       "Rivi�re",
	"tifv3_15.05.88"                 =>       "Salle � manger priv�e", 
	"tifv3_15.05.90"                 =>       "Salle d'eau commune", 
	"tifv3_15.05.91"                 =>       "Salle d'eau priv�e", 
	"tifv3_15.05.93"                 =>       "Salle de bain priv�e",   
	"tifv3_15.05.94"                 =>       "Salle de billard",
	"tifv3_15.05.95"                 =>       "Salle de gym",
	"tifv3_15.05.96"                 =>       "Salle de jeux",   
	"tifv3_15.05.97"                 =>       "Salle de projection", 
	"tifv3_15.05.98"                 =>       "Salle de remise en forme",
	"tifv3_15.05.99"                 =>       "Salle de r�union",   
	"tifv3_15.06.01"                 =>       "Accueil nuit",
	"tifv3_15.06.04"                 =>       "Animation th�matique sp�cifique",   
	"tifv3_15.06.05"                 =>       "Animaux accept�s",   
	"tifv3_15.06.06"                 =>       "Alimentation/Point alimentation", 
	"tifv3_15.06.09"                 =>       "Baby Club",   
	"tifv3_15.06.10"                 =>       "Baby Sitter", 
	"tifv3_15.06.11"                 =>       "Banquet", 
	"tifv3_15.06.12"                 =>       "Bar / buvette",   
	"tifv3_15.06.14"                 =>       "Biblioth�que",   
	"tifv3_15.06.15"                 =>       "Blanchisserie",   
	"tifv3_15.06.16"                 =>       "Boutique",
	"tifv3_15.06.17"                 =>       "Bureau de change",
	"tifv3_15.06.19"                 =>       "Cabine t�l�phonique / Point Phone", 
	"tifv3_15.06.20"                 =>       "Circuits touristiques",   
	"tifv3_15.06.21"                 =>       "Club Adolescents",
	"tifv3_15.06.24"                 =>       "Coffres clients", 
	"tifv3_15.06.25"                 =>       "Commerce alimentaire",
	"tifv3_15.06.26"                 =>       "Commerces",   
	"tifv3_15.06.27"                 =>       "Commerces 1�re n�cessit�", 
	"tifv3_15.06.28"                 =>       "Cyber espace / bornes acc�s Internet",   
	"tifv3_15.06.29"                 =>       "Demi-pension",
	"tifv3_15.06.30"                 =>       "D�p�t de gaz",  
	"tifv3_15.06.31"                 =>       "D�p�t de glace",
	"tifv3_15.06.32"                 =>       "Documentation Touristique",   
	"tifv3_15.06.34"                 =>       "Espace jeux", 
	"tifv3_15.06.36"                 =>       "Garderie",
	"tifv3_15.06.37"                 =>       "Halte Garderie",  
	"tifv3_15.06.39"                 =>       "Information", 
	"tifv3_15.06.40"                 =>       "Informations touristiques",   
	"tifv3_15.06.41"                 =>       "Lave linge",  
	"tifv3_15.06.42"                 =>       "Lave linge collectif",
	"tifv3_15.06.43"                 =>       "Librairie",   
	"tifv3_15.06.44"                 =>       "Location bungalow",   
	"tifv3_15.06.46"                 =>       "Location caravanes",  
	"tifv3_15.06.47"                 =>       "Location de linge",   
	"tifv3_15.06.48"                 =>       "Location de mat�riel",   
	"tifv3_15.06.51"                 =>       "Location de mobil home",  
	"tifv3_15.06.53"                 =>       "Location de v�los",  
	"tifv3_15.06.56"                 =>       "Location mat�riel de sport", 
	"tifv3_15.06.57"                 =>       "Location tente/caravane", 
	"tifv3_15.06.58"                 =>       "Location tentes", 
	"tifv3_15.06.59"                 =>       "Massages",
	"tifv3_15.06.62"                 =>       "M�nage quotidien",   
	"tifv3_15.06.63"                 =>       "Messages t�l�phoniques",
	"tifv3_15.06.65"                 =>       "Navette a�roport ou gare",   
	"tifv3_15.06.67"                 =>       "Nettoyage / m�nage", 
	"tifv3_15.06.68"                 =>       "Nettoyage / m�nage en fin de s�jour",   
	"tifv3_15.06.69"                 =>       "Paniers Pique-nique", 
	"tifv3_15.06.70"                 =>       "Pharmacie",   
	"tifv3_15.06.71"                 =>       "Plats � emporter/Plats cuisin�s",   
	"tifv3_15.06.72"                 =>       "Plats cuisin�s", 
	"tifv3_15.06.73"                 =>       "Point argent",
	"tifv3_15.06.74"                 =>       "Point courrier",  
	"tifv3_15.06.75"                 =>       "R�servation a�riennes", 
	"tifv3_15.06.76"                 =>       "R�servation de prestations annexes", 
	"tifv3_15.06.77"                 =>       "R�servation excursions", 
	"tifv3_15.06.78"                 =>       "R�servation spectacles", 
	"tifv3_15.06.80"                 =>       "R�servations de prestations ext�rieures",   
	"tifv3_15.06.81"                 =>       "Restaurant",  
	"tifv3_15.06.82"                 =>       "Restaurant enfants",  
	"tifv3_15.06.83"                 =>       "R�veillon de No�l pour groupes",
	"tifv3_15.06.84"                 =>       "Room service",
	"tifv3_15.06.86"                 =>       "Self service",
	"tifv3_15.06.87"                 =>       "S�minaire",  
	"tifv3_15.06.88"                 =>       "Service en chambre",  
	"tifv3_15.06.89"                 =>       "Surveillance de nuit",
	"tifv3_15.06.90"                 =>       "Table d'h�te",   
	"tifv3_15.06.92"                 =>       "Traiteur",
	"tifv3_15.06.94"                 =>       "Vestiaire",   
	"tifv3_15.06.98"                 =>       "Ouverture 24/24", 
	"tifv3_06.03.01.03.01"              =>      "1 �pi",                  
	"tifv3_06.03.01.03.02"              =>      "2 �pis",                 
	"tifv3_06.03.01.03.03"              =>      "3 �pis",                 
	"tifv3_06.03.01.03.04"              =>      "4 �pis",                 
	"tifv3_06.03.01.03.05"              =>      "En cours de classement",  
	
"tifv3_06.03.02.01.01"              =>      "G�tes et Cheval",        
"tifv3_06.03.02.01.02"              =>      "G�tes de neige",         
"tifv3_06.03.02.01.03"              =>      "G�tes Panda",            
"tifv3_06.03.02.01.04"              =>      "G�tes de p�che",        
"tifv3_06.03.02.01.05"              =>      "G�tes de Prestige",      
"tifv3_06.03.02.01.06"              =>      "Vignoble",                
"tifv3_06.03.02.01.07"              =>      "1 �pi",                  
"tifv3_06.03.02.01.08"              =>      "2 �pis",                 
"tifv3_06.03.02.01.09"              =>      "3 �pis",                 
"tifv3_06.03.02.01.10"              =>      "4 �pis",                 
"tifv3_06.03.02.01.11"              =>      "5 �pis",                 
"tifv3_06.03.02.01.12"              =>      "En cours de classement",  
	
	/*on ne ajoute encore d'autres, via des requetes de ce type

SELECT  DISTINCT CONCAT('"tifv3_',  thesaurus, '"') , '=>' , CONCAT('"', lib, '",')
FROM tifv3_thesaurus
WHERE   CONCAT('tifv3_',  thesaurus, '') IN (
 'tifv3_06.04.01.01.06',
 'tifv3_02.01.05.01.01',
 )
 OR   CONCAT('tifv3_',  thesaurus, '') LIKE 'tifv3_06.04.01.01.%'
 OR   CONCAT('tifv3_',  thesaurus, '') LIKE 'tifv3_02.01.05.01.%'
 OR   CONCAT('tifv3_',  thesaurus, '') LIKE 'tifv3_06.04.01.03.%'
 
 OR   CONCAT('tifv3_',  thesaurus, '') LIKE 'tifv3_02.01.06.01.%'
 OR   CONCAT('tifv3_',  thesaurus, '') LIKE 'tifv3_06.04.01.04.%'
 OR   CONCAT('tifv3_',  thesaurus, '') LIKE 'tifv3_02.01.04.01.%'	
	
	*/
	"tifv3_02.01.04.01.01"              =>      "Chambre d'h�tes",                   
"tifv3_02.01.04.01.02"              =>      "Meubl�s et G�tes",                 
"tifv3_02.01.04.01.03"              =>      "Appartement",                        
"tifv3_02.01.04.01.04"              =>      "Chalet",                             
"tifv3_02.01.04.01.05"              =>      "Ch�teaux et demeures de prestige",  
"tifv3_02.01.04.01.06"              =>      "Maison",                             
"tifv3_02.01.05.01.01"              =>      "H�tels",                            
"tifv3_02.01.05.01.02"              =>      "H�tels - restaurant",               
"tifv3_02.01.06.01.01"              =>      "Camping � la ferme",                
"tifv3_02.01.06.01.02"              =>      "Terrain de camping class�",         
"tifv3_02.01.06.01.03"              =>      "Parc r�sidentiel de loisir",        
"tifv3_02.01.06.01.04"              =>      "Camp de tourisme - aire naturelle",  
"tifv3_02.01.06.01.05"              =>      "Camp de tourisme saisonnier",        
"tifv3_06.04.01.01.01"              =>      "1 �toile",                          
"tifv3_06.04.01.01.02"              =>      "2 �toiles",                         
"tifv3_06.04.01.01.03"              =>      "3 �toiles",                         
"tifv3_06.04.01.01.04"              =>      "4 �toiles",                         
"tifv3_06.04.01.01.05"              =>      "En cours de classement",             
"tifv3_06.04.01.01.06"              =>      "Non concern�",                      
"tifv3_06.04.01.01.07"              =>      "Syndicat d'initiative",              
"tifv3_06.04.01.01.08"              =>      "Non Class�",                        
"tifv3_06.04.01.03.01"              =>      "1 �toile",                          
"tifv3_06.04.01.03.02"              =>      "2 �toiles",                         
"tifv3_06.04.01.03.03"              =>      "3 �toiles",                         
"tifv3_06.04.01.03.04"              =>      "4 �toiles",                         
"tifv3_06.04.01.03.05"              =>      "4 �toiles Luxe",                    
"tifv3_06.04.01.03.06"              =>      "En cours de classement",             
"tifv3_06.04.01.03.07"              =>      "H�tel de pr�fecture",              
"tifv3_06.04.01.03.08"              =>      "Sans �toile",                       
"tifv3_06.04.01.03.09"              =>      "Non Class�",                        
"tifv3_06.04.01.03.10"              =>      "Tourisme",                           
"tifv3_06.04.01.04.01"              =>      "1 �toile",                          
"tifv3_06.04.01.04.02"              =>      "2 �toiles",                         
"tifv3_06.04.01.04.03"              =>      "3 �toiles",                         
"tifv3_06.04.01.04.04"              =>      "4 �toiles",                         
"tifv3_06.04.01.04.05"              =>      "5 �toiles",                         
"tifv3_06.04.01.04.06"              =>      "En cours de classement",             
"tifv3_06.04.01.04.07"              =>      "Non Class�",                                 
"tifv3_06.03.02.02.01"              =>      "1 cl�",                  
"tifv3_06.03.02.02.02"              =>      "2 cl�s",                 
"tifv3_06.03.02.02.03"              =>      "3 cl�s",                 
"tifv3_06.03.02.02.04"              =>      "4 cl�s",                 
"tifv3_06.03.02.02.05"              =>      "5 cl�s",                 
"tifv3_06.03.02.02.06"              =>      "En cours de classement",  
	
);

B2f_Json::$useBuiltinEncoderDecoder = true;

if (isset($_GET['callback'])) {
	echo $_GET['callback'] . '(' . B2f_Json::Encode($arrayTradJS) .')';
} else if (isset($_GET['var'])) {
	echo 'var ' . $_GET['var'] . ' = {"' . strtolower($_GET['langue']) . '":' . B2f_Json::Encode($arrayTradJS) . '};';
} else {
	console.error('erreur dans vos parametres get : callback|var sont obligatoire, callback est prioritaire sur var)');
}



//ob_end_flush();
?>