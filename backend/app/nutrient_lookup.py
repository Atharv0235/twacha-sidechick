"""
Nutrient-to-food lookup.

Each nutrient target maps to a hand-curated list of Indian foods.

DATA HONESTY (read before showing numbers to anyone):
  * `nutrient_value` is filled ONLY where the number was checked against the open
    Indian Nutrient Databank (INDB) ingredient tables (github.com/lindsayjaacks/
    Indian-Nutrient-Databank-INDB-: UK_fct.xlsx / US_fct.xlsx). Those foods carry
    source="INDB ..." . Everything else has no number on purpose.
  * `gi` values are approximate textbook figures; real GI varies with variety,
    ripeness and cooking. They are labelled source="approximate GI".
  * The raw IFCT 2017 tables must be requested from ICMR-NIN and are not in the repo,
    so most Indian staples cannot be number-checked yet.
  * Foods are suggestions for a class prototype, not medical or dietetic advice.

Two jobs:
  1. return the food list for each nutrient target;
  2. personalise it with the user's recent food log:
       - foods_to_add     -> hide things the user already eats
       - foods_to_reduce  -> keep them, and show the ones the user actually eats FIRST
"""
import re
from typing import Optional

_INDB_UK = "INDB (UK FCT 2021 table)"
_INDB_US = "INDB (US FCT table)"
_GI = "approximate GI; varies by variety and cooking"

FOOD_DATABASE: dict[str, dict] = {

    "low_glycemic": {
        "add": [
            {"name": "Rajma (kidney beans)", "gi": 29, "source": _GI, "reason": "Low-GI pulse; can replace part of the rice in a meal"},
            {"name": "Horse gram (kulthi / hurali)", "gi": 29, "source": _GI, "reason": "Low-GI legume used in many regional dishes"},
            {"name": "Chana (chickpeas)", "gi": 33, "source": _GI, "reason": "High protein, low GI, easy to add to a curry or salad"},
            {"name": "Whole moong dal", "gi": 38, "source": _GI, "reason": "Whole moong has a lower GI than the split, polished version"},
            {"name": "Curd (dahi)", "gi": 34, "source": _GI, "reason": "Eating it with a meal tends to lower that meal's overall GI"},
            {"name": "Jowar roti", "gi": 55, "source": _GI, "reason": "A swap for refined-wheat roti, with more fibre"},
            {"name": "Bajra roti", "gi": 54, "source": _GI, "reason": "A swap for refined-wheat roti, with more fibre"},
            {"name": "Ragi (finger millet)", "gi": 68, "source": _GI, "reason": "Better than white rice for many people, and rich in calcium"},
        ],
        "reduce": [
            {"name": "White rice", "gi": 76, "source": _GI, "reason": "A high-GI daily staple; try smaller portions with dal and vegetables"},
            {"name": "Maida roti / white bread", "gi": 70, "source": _GI, "reason": "Refined flour; includes most bakery items and naan"},
            {"name": "Poha (flattened rice)", "gi": 70, "source": _GI, "reason": "Often assumed healthy, but the GI is fairly high"},
            {"name": "Sugary chai / sweet drinks", "gi": 90, "source": _GI, "reason": "Liquid sugar raises blood glucose quickly"},
        ],
    },

    "dairy_reduce": {
        "add": [
            {"name": "Soy milk (unsweetened)", "reason": "A dairy substitute for a 2-week trial"},
            {"name": "Oat milk (unsweetened)", "reason": "Another trial substitute; easier to find in Indian cities now"},
            {"name": "Coconut milk (in cooking)", "reason": "A cooking substitute for cream or full-fat milk in curries"},
        ],
        "reduce": [
            {"name": "Full-fat milk (daily)", "reason": "Evidence is mixed. Try cutting back for 2 weeks and watch your acne score"},
            {"name": "Paneer (daily portions)", "reason": "Evidence is mixed. Try smaller portions during the trial"},
            {"name": "Ice cream / mithai", "reason": "Both sugary and dairy, so a double reason to cut back"},
        ],
    },

    "zinc": {
        "add": [
            {"name": "Pumpkin seeds (kaddu ke beej)", "nutrient_value": 6.6, "unit": "mg zinc/100g", "source": _INDB_UK, "reason": "A zinc-rich seed; a spoonful on salad or poha"},
            {"name": "Sesame seeds (til)", "nutrient_value": 5.3, "unit": "mg zinc/100g", "source": _INDB_UK, "reason": "Easy to add to roti dough or sprinkle on dal"},
            {"name": "Chia seeds", "nutrient_value": 4.34, "unit": "mg zinc/100g", "source": _INDB_US, "reason": "Soak in water or curd; also a source of omega-3"},
            {"name": "Chickpeas (chana)", "nutrient_value": 2.76, "unit": "mg zinc/100g", "source": _INDB_US, "reason": "A practical everyday zinc source from a pulse"},
            {"name": "Cashews", "reason": "Zinc plus healthy fats; a small handful"},
            {"name": "Whole moong dal", "reason": "A practical daily source, with a lower GI than split dal"},
        ],
        "reduce": [],
    },

    "omega3": {
        "add": [
            {"name": "Flaxseeds (alsi)", "reason": "A rich plant source of omega-3 (ALA); grind before eating"},
            {"name": "Walnuts (akhrot)", "reason": "A handful a day; also a source of omega-3 (ALA)"},
            {"name": "Chia seeds", "reason": "Soak in water or curd; a plant source of omega-3 (ALA)"},
            {"name": "Mustard oil", "reason": "A traditional cooking oil that contains some omega-3 (ALA)"},
            {"name": "Fatty fish (if you eat fish)", "reason": "Sardines, mackerel and similar fish give omega-3 (EPA and DHA)"},
        ],
        "reduce": [
            {"name": "Refined sunflower / corn oil (heavy use)", "reason": "Very high in omega-6; try mixing with or swapping for mustard, groundnut or olive oil"},
        ],
    },

    "antioxidant_vit_c": {
        "add": [
            {"name": "Amla (Indian gooseberry)", "reason": "One of the richest food sources of vitamin C"},
            {"name": "Guava", "reason": "Cheap, widely available; eat with the skin"},
            {"name": "Lemon / nimbu", "nutrient_value": 34, "unit": "mg vit C/100g (flesh)", "source": _INDB_UK, "reason": "Easy daily addition to dal, salad or water"},
            {"name": "Raw capsicum", "reason": "Add raw to salads; cooking reduces vitamin C"},
            {"name": "Fresh coriander leaves", "reason": "Use fresh as a garnish; cooking reduces vitamin C"},
            {"name": "Kiwi fruit", "nutrient_value": 71, "unit": "mg vit C/100g", "source": _INDB_UK, "reason": "A vitamin C-rich fruit where available"},
        ],
        "reduce": [],
    },

    "antioxidant_vit_e": {
        "add": [
            {"name": "Almonds (badam)", "reason": "A handful a day; one of the best food sources of vitamin E"},
            {"name": "Sunflower seeds", "reason": "A rich vitamin E source; sprinkle on salads or roti"},
            {"name": "Peanuts (groundnut)", "reason": "Affordable; eat roasted or as chutney"},
            {"name": "Kiwi fruit", "nutrient_value": 2.17, "unit": "mg vit E/100g", "source": _INDB_UK, "reason": "A fruit with some vitamin E where available"},
            {"name": "Mustard greens (sarson)", "reason": "Seasonal greens, easy as a sabzi"},
        ],
        "reduce": [],
    },

    "healthy_fats": {
        "add": [
            {"name": "Ghee (small amounts)", "reason": "About 1 tsp per meal; traditional, but high in saturated fat so keep it small"},
            {"name": "Coconut (fresh or dried)", "reason": "A traditional fat source for cooking and chutneys"},
            {"name": "Walnuts", "reason": "A nut with a good fat profile, including omega-3"},
            {"name": "Groundnut (peanut) chutney", "reason": "A practical daily fat source, especially in South Indian meals"},
        ],
        "reduce": [
            {"name": "Vanaspati / dalda (hydrogenated oil)", "reason": "May contain trans fat; best to limit"},
            {"name": "Deep-fried snacks (regularly)", "reason": "Often fried in repeatedly heated oil"},
        ],
    },

    "probiotic": {
        "add": [
            {"name": "Curd (home-set dahi)", "reason": "Contains live cultures; home-set usually has more than packaged"},
            {"name": "Chaas (buttermilk)", "reason": "Lighter than curd, with live cultures if made from fresh curd"},
            {"name": "Kanji (fermented carrot drink)", "reason": "A traditional fermented drink, mainly in north India"},
            {"name": "Idli / dosa batter (fermented)", "reason": "Fermented at home or bought fresh; the cooking itself kills the cultures"},
        ],
        "reduce": [],
    },

    "vitamin_d": {
        "add": [
            {"name": "Egg yolk", "reason": "One of the few common food sources of vitamin D"},
            {"name": "Fortified milk or soy milk", "reason": "Check the label; not all Indian dairy is fortified"},
            {"name": "Mushrooms (sun-exposed)", "reason": "Some mushrooms make vitamin D when left in sunlight"},
            {"name": "Ask a doctor about a vitamin D blood test", "reason": "Deficiency is common in India; food alone often is not enough, so test before supplementing"},
        ],
        "reduce": [],
    },

    "water_intake": {
        "add": [
            {"name": "Water through the day", "reason": "Keep a bottle with you; thirst and urine colour are simple guides"},
            {"name": "Coconut water", "reason": "Hydrating, and a natural alternative to sports drinks"},
            {"name": "Nimbu pani (without sugar)", "reason": "A flavoured way to drink more water"},
            {"name": "Cucumber", "reason": "A very water-rich vegetable; eat with the skin"},
        ],
        "reduce": [
            {"name": "Alcohol", "reason": "Acts as a diuretic and can dry out the body"},
            {"name": "Many cups of tea or coffee (more than about 3)", "reason": "Large amounts of caffeine have a mild diuretic effect"},
        ],
    },
}


# ── Name matching ─────────────────────────────────────────────────────────────

_STOP = {"of", "the", "and", "with", "in", "a", "an", "daily", "small", "fresh", "raw", "home", "set", "unsweetened"}


def _norm(text: str) -> str:
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return " ".join(text.split())


def _aliases(name: str) -> list[str]:
    """'Rajma (kidney beans)' -> ['rajma', 'kidney beans', 'rajma kidney beans']"""
    out = []
    for part in re.split(r"[()/,]", name):
        n = _norm(part)
        if n and n not in _STOP:
            out.append(n)
    full = _norm(name)
    if full not in out:
        out.append(full)
    return out


def _phrase_in(needle: str, haystack: str) -> bool:
    return f" {needle} " in f" {haystack} "


def _matches(logged: str, food_name: str) -> bool:
    """True if a logged food string plausibly means this database food."""
    if not logged:
        return False
    for alias in _aliases(food_name):
        if logged == alias or _phrase_in(alias, logged):
            return True
        # user typed a shorter word that appears in the alias ('rice' ~ 'white rice')
        if len(logged) >= 4 and _phrase_in(logged, alias):
            return True
    return False


def food_matches(logged: str, food_name: str) -> bool:
    """Public wrapper: does a logged food string (any case) mean this canonical food?"""
    return _matches(_norm(logged or ""), food_name)


def canonical_food(name: str) -> Optional[str]:
    """Exact (case-insensitive) match against the canonical list, or None."""
    wanted = (name or "").strip().lower()
    for n in all_food_names():
        if n.lower() == wanted:
            return n
    return None


def all_food_names() -> list[str]:
    """Canonical names for the app's food-log picker, so logs match exactly."""
    names = []
    for entry in FOOD_DATABASE.values():
        for side in ("add", "reduce"):
            for f in entry.get(side, []):
                if f["name"] not in names:
                    names.append(f["name"])
    return sorted(names)


def get_foods_for_targets(
    nutrient_targets: list[str],
    recently_eaten: Optional[list[str]] = None,
    max_add: int = 4,
    max_reduce: int = 3,
) -> dict[str, dict]:
    """
    For each nutrient target return foods_to_add and foods_to_reduce.

    foods_to_add    : foods the user does NOT already eat (so advice is new).
    foods_to_reduce : all candidates, with the ones the user DOES eat listed
                      first and flagged logged_recently=True.
    """
    eaten = [_norm(f) for f in (recently_eaten or []) if f and f.strip()]

    def eats(food: dict) -> bool:
        return any(_matches(e, food["name"]) for e in eaten)

    result = {}
    for key in nutrient_targets:
        entry = FOOD_DATABASE.get(key)
        if not entry:
            continue

        add_list = [dict(f, logged_recently=False) for f in entry.get("add", []) if not eats(f)][:max_add]

        reduce_all = [dict(f, logged_recently=eats(f)) for f in entry.get("reduce", [])]
        reduce_all.sort(key=lambda f: not f["logged_recently"])      # stable: eaten first
        reduce_list = reduce_all[:max_reduce]

        result[key] = {"foods_to_add": add_list, "foods_to_reduce": reduce_list}
    return result
