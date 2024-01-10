import pytest
from fastapi.testclient import TestClient
from main import app, do_calculate

client = TestClient(app)


# test calculations
def test_calculate():
    test_cases = [
        # simple operations
        {"expression": "10 4 -", "expected_result": 6},
        {"expression": "3 4 ^", "expected_result": 81},
        {"expression": "5 4 %", "expected_result": 1},
        {"stack": [12], "expression": "3 4 +", "expected_result": 7},
        # complex expressions
        {"expression": "15 7 1 1 + - / 3 * 2 1 1 + + -", "expected_result": 5},
        {"expression": "343 45 * 12 /", "expected_result": 1286.25},
        {"expression": "343 45 + 12 /", "expected_result": 32.333333333333336},
        # passing a stack to perform calculate like stepped operations
        {"expression": "3 4 5 + *", "expected_result": 27, "expected_stack": [27]},
        {"stack": [27], "expression": "9 3", "expected_result": "", "expected_stack": [27, 9, 3]},
        {"stack": [27, 9, 3], "expression": "+ /", "expected_result": 2.25, "expected_stack": [2.25]},
    ]
    for case in test_cases:
        response = client.post(
            "/calculate",
            json={"stack": case.get("stack", []), "expression": case["expression"]}
        )
        assert response.status_code == 200
        assert response.json()['result_number'] == case["expected_result"]
        if "expected_stack" in case:
            assert response.json()['result_stack'] == case["expected_stack"]
        pass


# test erroneous inputs
def test_invalid():
    # invalid
    stack = []
    expression = '10 test -'

    with pytest.raises(Exception) as excinfo:
        do_calculate(stack, expression)

    assert "Expression invalide: test" in str(excinfo.value)

    # division by zero
    stack = []
    expression = '10 0 /'

    with pytest.raises(Exception) as excinfo:
        do_calculate(stack, expression)

    assert "Division par zero." in str(excinfo.value)

    # infinity
    stack = []
    expression = "inf inf /"

    with pytest.raises(Exception) as excinfo:
        do_calculate(stack, expression)

    assert "Resultat n'est pas un nombre." in str(excinfo.value)

    pass
