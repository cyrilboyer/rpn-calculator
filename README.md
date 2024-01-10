# Exercice Python calculatrice NPI
Temps passé: 5h38

## Description de la structure du projet
Vous trouverez plusieurs dossiers dans ce repo:
- client: client react pour interagir avec l'API (basé sur un module calculatrice existant)
- deployment: Dockerfiles, docker-compose et secrets
- server: implémentation en un seul fichier du service calculatrice avec FastAPI (Python 3.11)

## Déployer le projet avec Docker
Pour déployer le projet avec Docker, utilisez:
```sh
docker-compose -f deployment/docker-compose.yml up -d
```
Les ports et adresses:
- client: http://localhost:8080/
- server: http://localhost:8000/
- database: mongodb://admin:Test123@localhost:27099/

## Client: Run en mode développement
Projet créé avec create-react-app:
```sh
cd client
npm run start
```

## Server: Run en mode développement
Ce projet utilise uvicorn:
```sh
cd server
uvicorn main:app --reload
```

## Server: Tests avec pytest
Ce projet utilise pytest, quelques simples tests ont été écris:
```sh
cd server
pytest -v test.py
```

## Comment utiliser la calculette
La calculette s'utilise comme une calculette traditionnelle mais en entrant nos opérations en notation NPI, si vous voulez par exemple faire 3 + 1 + 4, vous devrez entrez nombres et operateurs groupés: 3 1 4 + +.
Vous pouvez aussi remplir le "stack" de la calculette, c'est à dire les valeurs stockées en mémoire en faisant, "3 1 4" puis "=" pour envoyer et ensuite "+ +" et "=" pour envoyer et recevoir le résultat.
AC reset le stack tandis que C efface juste le dernier caractère.

### Documentation de l'API
Rendez vous dans http://127.0.0.1:8000/docs une fois le service en route soit via Docker soit en mode développement avec uvicorn