from models import User, Category, Transaction, Budget
from sqlalchemy.orm import configure_mappers


def test_models_relationships():
    configure_mappers()

    assert User is not None
    assert Category is not None
    assert Transaction is not None
    assert Budget is not None