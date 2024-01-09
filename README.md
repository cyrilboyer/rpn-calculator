# Exercice Python calculatrice NPI

## Description de la structure du projet
Vous trouverez plusieurs dossier dans ce repo:
- client: client react pour interagir avec l'API (basé sur un module calculatrice existant)
- deployment: Dockerfiles, docker-compose et secrets
- server: implementation en un seul fichier du service calculatrice avec FastAPI

## Déployer le projet avec Docker
Pour déployer le projet avec Docker, utilisez:
```sh
docker-compose -f deployment/docker-compose.yml up -d
```

## Run en mode développement
Ce projet utilise uvicorn:
```sh
cd server
uvicorn main:app --reload
```

## Tests avec pytest
Ce projet utilise pytest, quelque simple tests ont étés écris:
```sh
cd server
pytest -v test.py
```

### Documentation de l'API
Rendez vous dans http://127.0.0.1:8000/docs une fois le service en route soit via Docker soit en mode dévelopment avec uvicorn