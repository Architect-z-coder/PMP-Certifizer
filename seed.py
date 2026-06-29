"""Load curated question banks from app/data/*.json (idempotent, upsert by external_id).
Add a new day's bank by dropping its JSON file into app/data/ — no code change needed."""
import os
import json
import glob

from sqlmodel import Session, select

from .models import Item, engine

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def load_item_banks() -> int:
    loaded = 0
    files = sorted(glob.glob(os.path.join(DATA_DIR, "*.json")))
    with Session(engine) as s:
        for path in files:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
            source = data.get("_meta", {}).get("source", os.path.basename(path))
            for it in data.get("items", []):
                ext = it.get("id")
                if not ext:
                    continue
                if s.exec(select(Item).where(Item.external_id == ext)).first():
                    continue  # already loaded
                s.add(Item(
                    external_id=ext,
                    type=it.get("type", "mcq"),
                    knowledge_area=it["knowledge_area"],
                    process_group=it.get("process_group", ""),
                    pmbok_ref=it.get("pmbok_ref", ""),
                    competency=it.get("competency", ""),
                    difficulty=int(it.get("difficulty", 1)),
                    prompt_fr=it["prompt"]["fr"], prompt_en=it["prompt"]["en"],
                    options_fr=json.dumps(it["options"]["fr"], ensure_ascii=False),
                    options_en=json.dumps(it["options"]["en"], ensure_ascii=False),
                    answer_index=int(it["answer_index"]),
                    rationale_fr=it["rationale"]["fr"], rationale_en=it["rationale"]["en"],
                    source_note=source,
                ))
                loaded += 1
        s.commit()
    return loaded
