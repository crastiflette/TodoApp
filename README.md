# 📝 To-Do List

Une application web simple et responsive pour gérer ses tâches du quotidien, installable sur mobile comme une vraie application et utilisable hors ligne.

## Fonctionnalités

- Ajouter une tâche (bouton ou touche **Entrée**), avec ou sans date
- Tâches regroupées par jour : *Aujourd'hui*, *Demain*, dates passées signalées **En retard**
- Cocher une tâche comme terminée
- Modifier une tâche (double-clic ou icône crayon, **Entrée** pour valider, **Échap** pour annuler)
- Supprimer une tâche, avec **annulation** possible pendant quelques secondes
- Filtrer : toutes / à faire / terminées
- Compteur de tâches restantes et bouton « Effacer les terminées »
- Glisser-déposer pour réordonner ou changer la date d'une tâche
- Thème sombre automatique (selon les réglages de l'appareil)
- Sauvegarde automatique dans le `localStorage`, synchronisée entre les onglets
- Installable (PWA) et fonctionne hors ligne grâce à un service worker

## Technologies utilisées

- HTML sémantique et accessible (labels, ARIA, navigation clavier)
- CSS (variables, Flexbox, responsive, `prefers-color-scheme`)
- JavaScript (état centralisé, délégation d'événements, `localStorage`)
- [SortableJS](https://github.com/SortableJS/Sortable) pour le glisser-déposer (inclus dans `vendor/`)

## Structure

```
index.html            Structure de la page
style.css             Styles
script.js             Logique de l'application
sw.js                 Service worker (mode hors ligne)
manifest.webmanifest  Informations d'installation (PWA)
icons/                Icônes de l'application
vendor/               Bibliothèques externes
```

## Lancer en local

Le service worker nécessite un serveur (il ne fonctionne pas en ouvrant le fichier directement) :

```bash
python3 -m http.server 8000
```

puis ouvrir <http://localhost:8000>.

> Après avoir modifié des fichiers, incrémenter `CACHE_VERSION` dans `sw.js` pour que les utilisateurs reçoivent la mise à jour.

## Installation sur mobile

1. Ouvre l'URL de l'application dans ton navigateur
2. **iPhone** → bouton partage → "Sur l'écran d'accueil"
3. **Android** → menu ⋮ → "Ajouter à l'écran d'accueil"

## Démo

🔗 [Ouvrir l'application](https://crastiflette.github.io/TodoApp)

---

Projet réalisé dans le cadre d'un apprentissage du développement web (HTML, CSS, JavaScript).
