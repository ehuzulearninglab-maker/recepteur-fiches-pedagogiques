# Fiche pédagogique

Application web pour recevoir, ranger, afficher, corriger et exporter les fiches pédagogiques validées depuis un GPT personnalisé.

## Rôle de l'application

L'application ne génère pas de fiches par elle-même. Le GPT personnalisé prépare la fiche, l'enseignant la valide dans ChatGPT, puis l'action GPT envoie la fiche à l'API de l'application.

L'application sert à :

- recevoir les fiches par API ;
- les associer au bon enseignant grâce à son courriel ;
- afficher le canevas pédagogique ;
- modifier et sauvegarder ;
- exporter en PDF ou Word ;
- gérer les comptes depuis l'espace administrateur.

## Route d'import GPT

`POST /api/fiches/import`

L'appel doit contenir une clé secrète dans l'en-tête :

`x-import-secret: CLE_SECRETE`

Le corps JSON doit contenir au minimum :

```json
{
  "utilisateur_email": "enseignant@example.com",
  "fiche": {
    "fiche_de": "Mathématiques",
    "classe": "CM2",
    "date": "2026-05-21",
    "duree": "45 min",
    "deroulement": [],
    "consignes": "",
    "resultats_attendus": ""
  }
}
```

Aliases acceptés pour le courriel : `email`, `courriel`, `enseignant_email`, `compte_email`.

## Variables d'environnement

Copier `.env.example` vers `.env.local` en local, puis renseigner les mêmes variables dans Vercel.

Variables principales :

- `IMPORT_SECRET_KEY` : clé secrète utilisée par l'action GPT ;
- `AUTH_SECRET` : secret de session ;
- `DATABASE_URL` : connexion PostgreSQL ou Supabase ;
- `NEXT_PUBLIC_APP_URL` : URL publique de l'application ;
- `GEMINI_API_KEY` : facultatif, seulement si l'option de mise en forme IA est activée ;
- `GEMINI_MODEL` : modèle Gemini utilisé, par défaut `gemini-2.5-flash-lite`.

## Base de données

Le schéma PostgreSQL se trouve dans `docs/schema-postgresql.sql`.

Tables principales :

- `utilisateurs` ;
- `fiches` ;
- `historique` ;
- `import_activites` ;
- `parametres_app`.

En production, utiliser PostgreSQL ou Supabase. Sans `DATABASE_URL`, l'application utilise un stockage local/temporaire utile seulement pour tester.

## Séparation des projets

Ce dossier est réservé uniquement à l'application de fiches pédagogiques. Toute autre application doit rester dans son propre dossier et son propre dépôt.
