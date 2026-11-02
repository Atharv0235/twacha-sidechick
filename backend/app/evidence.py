"""
Evidence text shown with each recommendation.

Every source below was opened and read while preparing this file (Oct 2026).
Where no study was verified, the text says so instead of citing a paper.
Tier meaning:  clinical = strong, consistent trial evidence
               mixed    = some support but inconsistent or indirect
               traditional = cultural / complementary practice
NOTE: none of the nutrient links below reached "clinical", so none is labelled that way.

The nutrient-scoring weights in recommender.py are PLACEHOLDERS chosen by the team.
They are not taken from the papers cited here.
"""

EVIDENCE = {
    "low_glycemic": {
        "title": "Choose lower-glycemic foods",
        "evidence_tier": "mixed",
        "source_note": "Systematic review and meta-analysis of low glycemic load diets and acne (Shahid Sadoughi University of Medical Sciences, 2020) suggests lower severity; a 2025 meta-analysis in Medicinus 15(1) found no significant pooled link. Evidence is inconsistent.",
        "nutrient_explanation": "Some studies link high-glycemic meals to more acne, possibly through insulin and related hormones. Trial results are inconsistent, so treat this as a sensible 2-week experiment rather than a proven fix.",
    },
    "dairy_reduce": {
        "title": "Try cutting back on dairy (2-week trial)",
        "evidence_tier": "mixed",
        "source_note": "A 2025 meta-analysis of 5 studies (716 people, Medicinus 15(1)) found no significant link between dairy intake and acne, though hormonal mechanisms are plausible.",
        "nutrient_explanation": "The dairy and acne link is not established and differs between people. If you try it, change one thing for two weeks and watch your acne trend.",
    },
    "zinc": {
        "title": "Include more zinc-rich foods",
        "evidence_tier": "mixed",
        "source_note": "Systematic review and meta-analysis, Dermatologic Therapy 2020;33(6):e14252: people with acne had lower serum zinc, and zinc treatment reduced inflamed papules. Those trials used supplements, not food.",
        "nutrient_explanation": "Zinc is linked to acne in studies, but the trials used supplements. We do not know that eating more zinc-rich food has the same effect.",
    },
    "omega3": {
        "title": "Include more omega-3 foods",
        "evidence_tier": "mixed",
        "source_note": "Literature review on omega-3 and omega-6 and acne (Rogalski et al., 2024): a diet richer in omega-3 and lower in omega-6 may help; the authors say more clinical research is needed.",
        "nutrient_explanation": "Omega-3 fats may help calm inflammation, and a few foods are rich in them. The evidence for skin is preliminary.",
    },
    "antioxidant_vit_c": {
        "title": "Add vitamin C-rich foods",
        "evidence_tier": "mixed",
        "source_note": "A 2026 systematic review (Siriraj Medical Journal 78(9)) found 'controversial' results for PM2.5 and acne. Raising this suggestion on high-AQI days is an experimental feature of this app, not an established finding.",
        "nutrient_explanation": "Fruit and vegetables rich in vitamin C are good general nutrition. Whether they protect skin from air pollution is not established.",
    },
    "antioxidant_vit_e": {
        "title": "Add vitamin E-rich foods",
        "evidence_tier": "mixed",
        "source_note": "Same pollution-and-acne review as above (Siriraj Medical Journal 2026): results are inconsistent. The AQI-based boost is an experimental feature of this app.",
        "nutrient_explanation": "Nuts and seeds are good general nutrition and a vitamin E source. A direct skin benefit from eating more of them is not established.",
    },
    "healthy_fats": {
        "title": "Make sure you get enough healthy fats",
        "evidence_tier": "mixed",
        "source_note": "General nutrition guidance. No specific study was verified for this app.",
        "nutrient_explanation": "Nuts, seeds and traditional cooking fats are part of a balanced diet. We have not verified that they improve dry-looking skin.",
    },
    "probiotic": {
        "title": "Include fermented foods",
        "evidence_tier": "traditional",
        "source_note": "Traditional Indian dietary practice. No study was verified for this app, and human evidence for food probiotics and acne is limited.",
        "nutrient_explanation": "Curd, chaas and fermented batters are everyday Indian foods and generally safe. Their effect on skin is not established.",
    },
    "vitamin_d": {
        "title": "Consider checking your vitamin D",
        "evidence_tier": "mixed",
        "source_note": "General health guidance. No skin-specific study was verified for this app.",
        "nutrient_explanation": "Vitamin D deficiency is common in India. A blood test is the reliable way to know; food alone often does not fix a deficiency. Ask a doctor before taking supplements.",
    },
    "water_intake": {
        "title": "Drink enough water through the day",
        "evidence_tier": "mixed",
        "source_note": "General health guidance. Evidence that extra water improves dry skin is limited.",
        "nutrient_explanation": "Staying hydrated is good for you. We do not claim it will change how dry your skin looks.",
    },
}


def get_evidence_tuple(key: str):
    e = EVIDENCE.get(key)
    if not e:
        return (key, "mixed", None, "No explanation available yet.")
    return e["title"], e["evidence_tier"], e["source_note"], e["nutrient_explanation"]
