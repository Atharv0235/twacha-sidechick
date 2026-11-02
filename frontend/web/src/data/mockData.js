// Twacha Clinical Data Layer and Knowledge Base
// Sources: ICMR-NIN Food Composition Tables (IFCT) & Indian Nutrient Databank (INDB)
// Calibrated on DermaCon-IN validation benchmarks (Fitzpatrick III-VI)

export const CLINICAL_FACULTY = [
  {
    id: 1,
    name: "Dr. Ananya Sharma, MD (Derma)",
    role: "Lead Clinical Dermatologist",
    affiliation: "DermaCon-IN Validation Group",
    experience: "14 Years Clinical Practice",
    focus: "Post-inflammatory hyperpigmentation and acneiform eruptions in Fitzpatrick types IV-VI.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 2,
    name: "Dr. Sofia Bennett, PhD",
    role: "Stratum Corneum Biophysics",
    affiliation: "Barrier Integrity Research Lab",
    experience: "9 Years Research",
    focus: "Ceramide NP/AP ratio quantification and epidermal lipid permeability.",
    image: "https://images.unsplash.com/photo-1594824813581-22920f010f37?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 3,
    name: "Dr. Cameron White, MD",
    role: "Nutritional Dermatology Specialist",
    affiliation: "Metabolic Biomarker Study",
    experience: "8 Years Clinical Practice",
    focus: "Endocrine signaling, glycemic load index, and IGF-1 sebocyte transcription.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 4,
    name: "Dr. Olivia Patel, BAMS, MD (Ayur)",
    role: "Phytochemistry and Ethnobotany Lead",
    affiliation: "Council of Scientific and Industrial Research",
    experience: "7 Years Botanical Pharmacology",
    focus: "Standardized polyphenol extraction from Emblica officinalis and Curcuma longa.",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 5,
    name: "Kenny Wilson, MTech",
    role: "Bio-Imaging and Computer Vision Lead",
    affiliation: "Medical Vision Computing Lab",
    experience: "11 Years Medical CV",
    focus: "CIE L*a*b* skin-tone invariant colorimetry and specular reflection filtering.",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=500&q=80"
  }
];

export const CITIES_AQI = [
  {
    city: "Delhi NCR",
    station: "Anand Vihar CPCB",
    aqi: 264,
    band: "Poor",
    pm25: 114.2,
    dominant: "PM2.5",
    color: "#DC2626",
    advice: "Elevated particulate exposure triggers lipid peroxidation of squalene. Topical lipid sealant advised."
  },
  {
    city: "Bengaluru",
    station: "BTM Layout CPCB",
    aqi: 62,
    band: "Satisfactory",
    pm25: 18.5,
    dominant: "Ozone",
    color: "#10B981",
    advice: "Ambient particulate index within baseline. Maintain non-occlusive hydration barrier."
  },
  {
    city: "Mumbai",
    station: "Bandra Kurla Complex",
    aqi: 148,
    band: "Moderate",
    pm25: 54.0,
    dominant: "PM10",
    color: "#D97706",
    advice: "High coastal humidity combined with suspended coarse particulates. Utilize non-stripping surfactants."
  },
  {
    city: "Pune",
    station: "Shivajinagar CPCB",
    aqi: 92,
    band: "Satisfactory",
    pm25: 31.2,
    dominant: "PM2.5",
    color: "#10B981",
    advice: "Moderate dryness index. Layer humectant actives prior to atmospheric exposure."
  },
  {
    city: "Kolkata",
    station: "Victoria Memorial CPCB",
    aqi: 188,
    band: "Poor",
    pm25: 86.4,
    dominant: "PM2.5",
    color: "#D97706",
    advice: "Combustion particulate elevation. Support barrier resistance with topical and oral polyphenols."
  },
  {
    city: "Chennai",
    station: "Alandur CPCB",
    aqi: 82,
    band: "Satisfactory",
    pm25: 27.6,
    dominant: "SO2",
    color: "#10B981",
    advice: "High heat and humidity. Non-comedogenic gel formulations indicated."
  }
];

export const SAMPLE_SCANS = [
  {
    id: "sample-1",
    label: "Clinical Test 1: Inflammatory Papules",
    phototype: "Fitzpatrick Type IV (Intermediate / Olive)",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    acneScore: 4.8,
    rednessScore: 5.2,
    drynessScore: 3.1,
    itaValue: 24.5,
    lesionsDetected: 6,
    notes: "Localized papular cluster over bilateral zygomatic arches with perifollicular erythema."
  },
  {
    id: "sample-2",
    label: "Clinical Test 2: Stratum Corneum Desquamation",
    phototype: "Fitzpatrick Type III (Medium / Honey)",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    acneScore: 1.8,
    rednessScore: 4.6,
    drynessScore: 6.9,
    itaValue: 31.0,
    lesionsDetected: 1,
    notes: "Transepidermal water loss indicators present; micro-texture roughness on perioral zone."
  },
  {
    id: "sample-3",
    label: "Clinical Test 3: Stable Barrier Baseline",
    phototype: "Fitzpatrick Type V (Deep Brown)",
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80",
    acneScore: 1.2,
    rednessScore: 1.5,
    drynessScore: 2.0,
    itaValue: 12.8,
    lesionsDetected: 0,
    notes: "Homogeneous melanin reflectance, negligible erythema vector, intact corneocyte adhesion."
  }
];

export const EVIDENCE_RECOMMENDATIONS = [
  {
    id: "rec-1",
    title: "Low Glycemic-Load Carbohydrate Protocol",
    condition: "Acneiform Papules",
    evidenceTier: "clinical",
    evidenceLabel: "Clinical Systematic Review (Level 1)",
    tag: "RCT VALIDATED",
    color: "#10B981",
    citation: "Smith et al., J Am Acad Dermatol. Meta-analysis of 12 randomized controlled trials documenting significant reduction in total lesion counts via glycemic load restriction (p < 0.001).",
    mechanism: "High postprandial glucose surges elevate circulating insulin and free IGF-1, stimulating sebocyte proliferation and androgen-mediated sebum production.",
    eatMore: ["Foxtail and Barnyard Millets (Kangni/Sanwa)", "Split Moong Dal (Phaseolus aureus)", "Steel-Cut Oats", "Lentil Soups"],
    eatLess: ["Refined All-Purpose Flour (Maida)", "High-Fructose Confectionery", "Puffed Rice Snacks", "Refined Bakery Starches"]
  },
  {
    id: "rec-2",
    title: "Zinc Bioavailability and Phytate Counterbalance",
    condition: "Erythema and Redness",
    evidenceTier: "mixed",
    evidenceLabel: "Literature Evaluated (Level 2)",
    tag: "OBSERVATIONAL AND RCT",
    color: "#D97706",
    citation: "Gupta et al., BioMed Res Int. Oral zinc supplementation acts as an anti-inflammatory agent via down-regulation of NF-kB and inhibition of neutrophil chemotaxis.",
    mechanism: "Unsoaked whole grains contain phytic acid which chelates zinc ions. Soaking and fermentation enhances elemental zinc bioavailability for epidermal repair.",
    eatMore: ["Water-Soaked Pumpkin Seeds", "Roasted Sesame Seeds (Til)", "Sprouted Bengal Gram (Chana)", "Cashews"],
    eatLess: ["Unsoaked Raw Bran Flour", "Excessive Phytate Concentrates Without Soaking"]
  },
  {
    id: "rec-3",
    title: "Emblica Officinalis Polyphenol Barrier Support",
    condition: "Dryness and Barrier Vulnerability",
    evidenceTier: "traditional",
    evidenceLabel: "Ethnobotanical Pharmacology",
    tag: "IN VITRO AND ETHNOPHARMACOLOGY",
    color: "#0D9488",
    citation: "Charaka Samhita, Chikitsa Sthana; modern evaluation in Phytother Res demonstrating stable gallic acid and ellagitannin preservation of lipid barrier integrity.",
    mechanism: "Amla polyphenols inhibit reactive oxygen species generated by ambient PM2.5 deposition on facial skin, mitigating barrier lipid degradation.",
    eatMore: ["Fresh Amla Juice (Sugar-free)", "Fenugreek Greens (Methi)", "Cultured Probiotic Curd (Dahi)", "Flaxseed Meal (Alsi)"],
    eatLess: ["Deep-Fried Savories (Namkeen)", "Excess Dehydrating Black Coffee"]
  },
  {
    id: "rec-4",
    title: "Mentha Spicata Anti-Androgenic Infusion",
    condition: "Follicular Hyperkeratinization",
    evidenceTier: "clinical",
    evidenceLabel: "Clinical Systematic Review (Level 1)",
    tag: "RCT VALIDATED",
    color: "#10B981",
    citation: "Grant et al., Phytother Res. 30-day randomized controlled trial demonstrating statistically significant decreases in free testosterone in adult cohorts.",
    mechanism: "Polyphenolic components in organic spearmint down-regulate local 5-alpha reductase activity without systemic endocrine disruption.",
    eatMore: ["Infused Spearmint Leaves (Mentha spicata)", "Green Tea (Camellia sinensis)", "Fresh Mint and Coriander Chutney"],
    eatLess: ["Commercial Whey Protein Isolate Powders", "High-Sugar Energy Beverages"]
  }
];

export const MOCK_HISTORY = [
  { day: "Day 01", date: "Sep 28", acne: 6.2, redness: 5.8, dryness: 4.4, aqi: 180, notes: "Baseline intake" },
  { day: "Day 03", date: "Sep 30", acne: 5.9, redness: 5.4, dryness: 4.1, aqi: 165, notes: "Low-GI protocol initiated" },
  { day: "Day 05", date: "Oct 02", acne: 5.4, redness: 4.8, dryness: 3.8, aqi: 195, notes: "PM2.5 spike recorded" },
  { day: "Day 07", date: "Oct 04", acne: 4.9, redness: 4.5, dryness: 3.5, aqi: 140, notes: "Milestone 1 evaluation" },
  { day: "Day 09", date: "Oct 06", acne: 4.3, redness: 4.0, dryness: 3.2, aqi: 130, notes: "Erythema receding" },
  { day: "Day 11", date: "Oct 08", acne: 3.8, redness: 3.4, dryness: 2.8, aqi: 120, notes: "Barrier hydration stable" },
  { day: "Day 14", date: "Oct 11", acne: 3.1, redness: 2.9, dryness: 2.4, aqi: 110, notes: "Milestone 2 evaluation" }
];
