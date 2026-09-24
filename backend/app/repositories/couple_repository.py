from sqlalchemy.orm import Session

from app.infrastructure.database.models.couple import CoupleModel


class SqlAlchemyCoupleRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_all(self) -> dict[str, dict]:
        rows = self._db.query(CoupleModel).all()
        return {row.couple_name: self._to_dict(row) for row in rows}

    def replace_all(self, couples: dict[str, dict]) -> None:
        self._db.query(CoupleModel).delete()
        for name, data in couples.items():
            self._db.add(CoupleModel(
                couple_name=name,
                man_name=str(data.get("man") or ""),
                pop_name=str(data.get("pop") or ""),
                kooi=str(data.get("kooi") or ""),
                kweekjaar=str(data.get("kweekjaar") or ""),
                jongen=list(data.get("jongen") or []),
                rondes=list(data.get("rondes") or []),
                aantal_jong_uit=str(data.get("aantalJongUit") or ""),
                opmerking_kweek=str(data.get("opmerkingKweek") or ""),
            ))

    @staticmethod
    def _to_dict(row: CoupleModel) -> dict:
        return {
            "man": row.man_name,
            "pop": row.pop_name,
            "kooi": row.kooi,
            "kweekjaar": row.kweekjaar,
            "jongen": row.jongen if isinstance(row.jongen, list) else [],
            "rondes": row.rondes if isinstance(row.rondes, list) else [],
            "aantalJongUit": row.aantal_jong_uit,
            "opmerkingKweek": row.opmerking_kweek,
        }
