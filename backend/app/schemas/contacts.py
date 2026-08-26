from pydantic import BaseModel


class ContactSchema(BaseModel):
    Naam: str = ""
    Voornaam: str = ""
    Straat: str = ""
    Nummer: str = ""
    Postcode: str = ""
    Gemeente: str = ""
    Provincie: str = ""
    Gsmnummer: str = ""
    Website: str = ""
    Extra: dict = {}


class ContactsRequest(BaseModel):
    contacts: dict[str, ContactSchema] = {}


class ContactsResponse(BaseModel):
    contacts: dict[str, ContactSchema] = {}
