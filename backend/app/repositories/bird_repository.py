from sqlalchemy.orm import Session

from app.infrastructure.database.models.bird import BirdModel
from app.schemas.state import BirdSchema


class SqlAlchemyBirdRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_all(self) -> dict[str, BirdSchema]:
        rows = self._db.query(BirdModel).all()
        return {row.bird_key: self._to_schema(row) for row in rows}

    def replace_all(self, birds: dict[str, BirdSchema]) -> None:
        self._db.query(BirdModel).delete()
        for key, bird in birds.items():
            self._db.add(BirdModel(
                bird_key=key,
                stamnummer=bird.Stamnummer,
                ringnummer=bird.Ringnummer,
                ringmaat=bird.Ringmaat,
                geslacht=bird.Geslacht,
                mutatie=bird.Mutatie,
                gezoomd=bird.Gezoomd,
                factor=bird.Factor,
                split1=bird.Split1,
                split2=bird.Split2,
                split3=bird.Split3,
                split4=bird.Split4,
                status=bird.Status,
                herkomst=bird.Herkomst,
                kooi=bird.Kooi,
                kweekjaar=bird.Kweekjaar,
                vader_name=bird.Vader,
                moeder_name=bird.Moeder,
                aankoop_contact_id=bird.AankoopContactId,
                opmerking=bird.Opmerking,
            ))

    @staticmethod
    def _to_schema(row: BirdModel) -> BirdSchema:
        return BirdSchema(
            Stamnummer=row.stamnummer,
            Ringnummer=row.ringnummer,
            Ringmaat=row.ringmaat,
            Geslacht=row.geslacht,
            Mutatie=row.mutatie,
            Gezoomd=row.gezoomd,
            Factor=row.factor,
            Split1=row.split1,
            Split2=row.split2,
            Split3=row.split3,
            Split4=row.split4,
            Status=row.status,
            Herkomst=row.herkomst,
            Kooi=row.kooi,
            Kweekjaar=row.kweekjaar,
            Vader=row.vader_name,
            Moeder=row.moeder_name,
            AankoopContactId=row.aankoop_contact_id,
            Opmerking=row.opmerking,
        )
