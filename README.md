# WereO'clock

WereO'clock est une horloge familiale connectée conçue pour permettre aux jeunes enfants de visualiser en un coup d'œil où se trouvent les membres de leur famille, sans écran et sans interaction numérique.

Chaque aiguille de l'horloge physique pointe vers un lieu — maison, école, travail, sport — et se déplace automatiquement selon le planning configuré par le parent via une application web.

---

## Architecture du projet

Le système repose sur trois environnements distincts :

- **Frontend** : Application React déployée sur Vercel  
- **Backend** : API Node.js/Express déployée sur Render  
- **Raspberry** : API Flask + Raspberry Pi Pico (liaison USB série)

---

## Accès à l'application

L'application web est accessible publiquement sans installation :

```
https://www.where-o-clock.be
```

---

## Structure du dépôt

```
WereO'clock/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration base de données
│   │   ├── controllers/     # Logique métier
│   │   ├── routes/          # Définition des routes API
│   │   ├── services/        # Services 
│   │   ├── tests/           # Tests unitaires Jest
│   │   └── utils/           # Utilitaires 
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      
│   │   ├── pages/           
│   │   └── services/       
│   └── package.json
│
└── raspberry/
    ├── pico_serial.py       # Script MicroPython Raspberry Pi Pico
    ├── app.py               # API Flask locale (passerelle)
    ├── family_config.json   # Configuration famille locale
    └── requirements.txt     # Dépendances Python
```

---

## Installation et lancement

### Prérequis

- Node.js v18+
- Python 3.10+
- Raspberry Pi Pico + câble USB

---

### Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` :

```env
PORT=3000
AES_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Lancer le serveur :

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`

---

### Partie locale — Raspberry Pi Pico

> Cette partie fonctionne uniquement en local. Le Raspberry Pi Pico doit être connecté via USB.

Installer les dépendances Python :

```bash
cd raspberry
pip install -r requirements.txt
```

Configurer le fichier `family_config.json` avec l'identifiant de la famille :

```json
{
  "familyId": "family_id"
}
```

Lancer la passerelle Flask :

```bash
python app.py
```

La passerelle interroge le backend toutes les 30 secondes et transmet les positions au Pico via liaison série USB.

---

## Tests unitaires

```bash
cd backend
npm test
```

Rapport de couverture :

```bash
npm test -- --coverage
```

Résultats actuels : **34 tests — 6 suites — couverture 83,12%**

Parties couvertes :
- Validation et sécurité du PIN
- Chiffrement AES-256-GCM des tokens OAuth
- Conversion angle / signal PWM
- Logique de planning et détection des conflits
- Configuration des positions du cadran

---

## Sécurité

| Élément | Mesure |
|---|---|
| Communications | HTTPS via Vercel et Render |
| Secrets et clés | Variables d'environnement (.env) |
| Code PIN | Hashage bcrypt + blocage après 3 tentatives |
| Tokens OAuth | Chiffrement AES-256-GCM en base de données |
| API backend | Configuration CORS restrictive |
| Entrées utilisateur | Validation côté serveur |

---

## Branches Git

| Branche | Rôle |
|---|---|
| `main` | Version stable et déployée |
| `dev` | Branche de développement utilisée avant de fusionner vers `main` |
| `feature/...` | Branche utilisée pour développer une fonctionnalité précise |

Les nouvelles fonctionnalités sont développées dans une branche `feature/...`, puis fusionnées dans `dev`.  
Lorsque `dev` est testée et stable, elle peut être fusionnée dans `main`.

---

## Auteure

Projet réalisé par **Rajae Bouziani** dans le cadre du Travail de Fin d'Études - EPHEC, Bachelier en Technologies de l'Informatique, année académique 2025-2026.

