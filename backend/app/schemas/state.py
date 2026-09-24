from pydantic import BaseModel


class BirdSchema(BaseModel):
    Stamnummer: str = ""
    Ringnummer: str = ""
    Ringmaat: str = ""
    Geslacht: str = ""
    Mutatie: str = ""
    Gezoomd: str = ""
    Factor: str = ""
    Split1: str = ""
    Split2: str = ""
    Split3: str = ""
    Split4: str = ""
    Status: str = ""
    Herkomst: str = ""
    Kooi: str = ""
    Kweekjaar: str = ""
    Vader: str = ""
    Moeder: str = ""
    Opmerking: str = ""
    AankoopContactId: str = ""


class StateRequest(BaseModel):
    birds: dict[str, BirdSchema] = {}
    couples: dict[str, dict] = {}


class StateResponse(BaseModel):
    birds: dict[str, BirdSchema] = {}
    couples: dict[str, dict] = {}
