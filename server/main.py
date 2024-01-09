import os
import csv
import io
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from math import fsum, prod, fmod, pow, isnan
from motor.motor_asyncio import AsyncIOMotorClient

isProduction = os.getenv('PRODUCTION', 'False')

description = """Une implémentation très simple d'une API (JSON) pour calculatrice NPI.

Seulement 2 méthodes éxiste, calculate (POST) et export (GET).<br>
La méthode calculate accepte des données au format JSON.


* **calculate** calcule l'expression passé par la propriété "expression".<br>
Un array de nombres, "stack", peut aussi être passé pour mimicker le fonctionnement d'une
calculatrice et éffecturer des opérations en plusieurs fois (voir test.py pour examples).

* **export** les résultats et arguments étant sauvegardé dans un base de donnée, cette
fonction nous permet d'experter les résultats au format CSV.
"""
app = FastAPI(title="Simple Calculatrice NPI",
              summary="Exercice Python + React calculatrice NPI.",
              description=description,
              version="1.0.0",
              contact={
                  "name": "Cyril Boyer",
                  "url": "https://cyrilboyer.fr",
              })

# set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, change in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# db client
if isProduction == 'True':
    with open('/run/secrets/database_password', 'r') as secret_file:
        database_password = secret_file.read().strip()
    client = AsyncIOMotorClient(f"mongodb://admin:{database_password}@database:27017/")
    db = client.rpn
    calculations_collection = client.rpn.calculations


# type
class ExpressionRequest(BaseModel):
    stack: List[float] = []
    expression: str


# calculation function
def do_calculate(stack: List[float] = [], expression: str = ""):
    result = None
    for part in expression.split():
        if part in ["+", "-", "*", "/", "%", "^"]:
            b, a = stack.pop(), stack.pop()
            if part == "+":
                result = fsum([a, b])
            elif part == "-":
                result = fsum([a, -b])
            elif part == "*":
                result = prod([a, b])
            elif part == "/":
                if b == 0:
                    raise HTTPException(status_code=418, detail="Division par zero.")
                result = a / b
            elif part == "%":
                result = fmod(a, b)
            elif part == "^":
                result = pow(a, b)
            stack.append(result)
        else:
            try:
                number = float(part)
                stack.append(number)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Expression invalide: {part}.")

    if isnan(stack[-1]):
        raise HTTPException(status_code=400, detail="Resultat n'est pas un nombre.")

    return stack, stack[-1]


# calculate route
@app.post("/calculate")
async def calculate(data: ExpressionRequest):
    initial_stack = data.stack.copy()
    result_stack, result_number = do_calculate(data.stack, data.expression)

    result = {
        "expression": data.expression,
        "initial_stack": initial_stack,
        "result_number": result_number,
        "result_stack": result_stack
    }

    if isProduction == 'True':
        await calculations_collection.insert_one(result)
        result.pop('_id', None)

    return result


# export route
@app.get("/export")
async def export():
    if isProduction != 'True':
        raise HTTPException(status_code=501, detail="Base de données non configuré.")

    cursor = calculations_collection.find({}, {'_id': 0})
    data = [document async for document in cursor]
    
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=["expression", "initial_stack", "result_number", "result_stack"])
    writer.writeheader()
    writer.writerows(data)

    buffer.seek(0)
    response = Response(content=buffer.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=calculations.csv"

    return response
